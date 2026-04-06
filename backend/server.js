import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';
import selfsigned from 'selfsigned';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { initDb, query } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the proxy (Render/PaaS) to allow Secure cookies over HTTPS proxy
app.set('trust proxy', 1);

// SSL Certificate Generation for LAN/HTTPS
const certDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);

const certFile = path.join(__dirname, 'certs', 'cert.pem');
const keyFile = path.join(__dirname, 'certs', 'key.pem');

// SSL Certificate Handling - Optional for local, handled by proxy in production
const certificates = (fs.existsSync(certFile) && fs.existsSync(keyFile)) ? {
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile)
} : null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Improved CORS for flexibility
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request Logger with Cookie inspection
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
    if (req.cookies) {
        console.log(`[Cookies] ${Object.keys(req.cookies).join(', ') || 'None'}`);
    }
    next();
});

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'uploads/');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize Database
initDb();

// Email Configuration
// Email Configuration
const transporter = nodemailer.createTransport({
    host: '74.125.136.108', // Force Google IPv4 address for smtp.gmail.com
    port: 587,
    secure: false, 
    connectionTimeout: 10000, // Wait 10s for connection
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendNotificationEmail = async (applicantData) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.NOTIFICATION_EMAIL,
        subject: `New ASMIS Registration: ${applicantData.role}`,
        html: `
            <h3>New Registration Received</h3>
            <p><strong>Role:</strong> ${applicantData.role}</p>
            <p><strong>Name:</strong> ${applicantData.full_name}</p>
            <p><strong>Email:</strong> ${applicantData.email}</p>
            <p><strong>Phone:</strong> ${applicantData.phone || 'N/A'}</p>
            <p><strong>Country:</strong> ${applicantData.country}</p>
            <p><strong>Organization:</strong> ${applicantData.organization || 'N/A'}</p>
            <p><strong>Social Handle:</strong> ${applicantData.social_handle || 'N/A'}</p>
            ${applicantData.metadata ? `
                <h4>Additional Info:</h4>
                <ul>
                    ${Object.entries(applicantData.metadata).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
                </ul>
            ` : ''}
            <div style="margin-top: 20px;">
                <a href="https://192.168.10.49:5000/api/admin/approve-from-email/${applicantData.id}" 
                   style="background-color: #c29958; color: #120e0c; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Approve Applicant
                </a>
            </div>
            <p style="color: #666; font-size: 0.8rem; margin-top: 20px;">Registration Time: ${new Date().toLocaleString()}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Notification email sent for applicant: ${applicantData.email}`);
    } catch (error) {
        console.error('Error sending notification email:', error);
    }
};

const sendApplicantRegistrationEmail = async (applicantData) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: applicantData.email,
        subject: `Welcome to ASMIS - Registration Received`,
        html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h2>Welcome, ${applicantData.full_name}!</h2>
                <p>We have successfully received your registration application for the <strong>${applicantData.role}</strong> role.</p>
                <p>Our team will review your application shortly. You will receive another email once your application is approved.</p>
                <br/>
                <p>Best regards,</p>
                <p>The ASMIS Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Registration confirmation sent to applicant: ${applicantData.email}`);
    } catch (error) {
        console.error('Error sending applicant registration email:', error);
    }
};

// Generate Unique Confirmation Code (6-digit number)
const generateConfirmationCode = () => {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * 10).toString();
    }
    return code;
};

const sendApplicantApprovalEmail = async (applicantData, qrImage, confirmationCode) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: applicantData.email,
        subject: `ASMIS Application Approved - Your QR Ticket`,
        html: `
            <div style="font-family: sans-serif; padding: 30px; text-align: center; color: #120e0c;">
                <h2 style="color: #4caf50;">Congratulations, ${applicantData.full_name}!</h2>
                <p style="font-size: 1.1rem;">Your application for the <strong>${applicantData.role}</strong> role at ASMIS has been approved.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border: 1px dashed #c29958; border-radius: 10px; margin: 25px auto; max-width: 400px;">
                    <p style="margin: 0; color: #666; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</p>
                    <p style="margin: 5px 0 0; color: #120e0c; font-size: 1.8rem; font-weight: bold; letter-spacing: 2px;">${confirmationCode}</p>
                </div>

                <p>Below is your accreditation QR Code. Please present this at the venue along with your code.</p>
                
                <div style="margin: 30px auto;">
                    <img src="cid:qrcode" alt="QR Code" style="width: 250px; height: 250px; border: 2px solid #c29958; border-radius: 10px; padding: 10px; background: white;"/>
                </div>
                
                <p style="font-size: 0.9rem; color: #666;">If the image doesn't display, you can also find it attached to this email.</p>
                <br/>
                <p>We look forward to seeing you at the summit!</p>
                <p>Best regards,</p>
                <p>The ASMIS Team</p>
            </div>
        `,
        attachments: [
            {
                filename: 'asmis_ticket_qr.png',
                path: qrImage,
                cid: 'qrcode'
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent to applicant: ${applicantData.email}`);
    } catch (error) {
        console.error('Error sending applicant approval email:', error);
    }
};

const sendApplicantRejectionEmail = async (applicantData, reason) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: applicantData.email,
        subject: `Update on your ASMIS Application`,
        html: `
            <div style="font-family: sans-serif; padding: 30px; color: #120e0c;">
                <h2>Dear ${applicantData.full_name},</h2>
                <p>Thank you for your interest in the African Social Media Influencers Summit (ASMIS) 2026.</p>
                <p>After careful review of your application for the <strong>${applicantData.role}</strong> role, we regret to inform you that we are unable to approve your registration at this time.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid #c29958; margin: 20px 0;">
                    <p><strong>Reason/Remark:</strong> ${reason || 'Application does not meet current criteria.'}</p>
                </div>
                
                <p>We appreciate your passion for Africa's digital landscape and encourage you to follow our public updates for future opportunities.</p>
                <br/>
                <p>Best regards,</p>
                <p>The ASMIS Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Rejection email sent to applicant: ${applicantData.email}`);
    } catch (error) {
        console.error('Error sending applicant rejection email:', error);
    }
};

// --- Authentication & Authorization ---
const JWT_SECRET = process.env.JWT_SECRET || 'asmis_secret_key_2026';

const validatePasswordPolicy = (password) => {
    if (!password) return { valid: false, message: 'Password is required' };
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: 'Password must contain at least one special character' };
    return { valid: true };
};

const checkPasswordReuse = async (adminId, newPassword) => {
    // Check against current password
    const current = await query('SELECT password_hash FROM admins WHERE id = $1', [adminId]);
    if (current.rows.length > 0) {
        const isMatch = await bcrypt.compare(newPassword, current.rows[0].password_hash);
        if (isMatch) return true;
    }
    // Check against history
    const history = await query('SELECT password_hash FROM password_history WHERE admin_id = $1', [adminId]);
    for (const row of history.rows) {
        const isMatch = await bcrypt.compare(newPassword, row.password_hash);
        if (isMatch) return true;
    }
    return false;
};

const authenticateAdmin = (req, res, next) => {
    // Prefer token from cookie, fall back to Authorization header
    let token = req.cookies.admin_token;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        console.error(`[Auth] Token verification failed: ${err.message}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

const requireSuperadmin = (req, res, next) => {
    if (req.admin.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Superadmin required' });
    }
    next();
};

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query('SELECT * FROM admins WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const admin = result.rows[0];
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '15m' });
        
        // Set Secure, HttpOnly Cookie with 15-minute expiration
        const isProduction = process.env.NODE_ENV === 'production';
        
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: true, // Required for SameSite=None
            sameSite: 'none', 
            maxAge: 24 * 60 * 60 * 1000 // Increase to 24h for convenience
        });

        res.json({ role: admin.role, username: admin.username, token });
    } catch (err) {
        console.error('[Login] Error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_token', { 
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ success: true });
});

// --- Public Routes ---

// Get All News
app.get('/api/news', async (req, res) => {
    try {
        const result = await query('SELECT * FROM news ORDER BY date DESC, created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Create News (Admin)
app.post('/api/admin/news', authenticateAdmin, upload.single('image'), async (req, res) => {
    const { title, description, date, link } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : '';

    try {
        const result = await query(
            'INSERT INTO news (title, description, date, image_url, link) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, date, image_url, link]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create news item' });
    }
});

// Get All Gallery Items
app.get('/api/gallery', async (req, res) => {
    try {
        const result = await query('SELECT * FROM gallery ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch gallery items' });
    }
});

// Create Gallery Item (Admin)
app.post('/api/admin/gallery', authenticateAdmin, upload.single('media'), async (req, res) => {
    const { title, type, event_name } = req.body;
    const media_url = req.file ? `/uploads/${req.file.filename}` : '';

    try {
        const result = await query(
            'INSERT INTO gallery (title, type, media_url, event_name) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, type, media_url, event_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create gallery item' });
    }
});

const validatePhone = (phone) => {
    // Basic regex for international phone numbers: +? [7 to 20 digits, spaces, dashes, or parens]
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    return phoneRegex.test(phone);
};

// Register Applicant
app.post('/api/register', upload.any(), async (req, res) => {
    console.log("=== API REGISTER CALLED ===");
    console.log("REQ.BODY:", req.body);
    console.log("REQ.FILES:", req.files);

    const { role, full_name, email, country, organization, social_handle, phone, ...otherFields } = req.body;

    // Phone validation (if provided)
    if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format. Please provide a valid number (7-20 characters, digits, spaces, dashes, parentheses allowed).' });
    }

    // Construct metadata from remaining fields
    const metadataObj = { ...otherFields };

    // Append any uploaded files to metadata
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            metadataObj[file.fieldname] = `/uploads/${file.filename}`;
        });
    }

    try {
        const result = await query(
            'INSERT INTO applicants (role, full_name, email, country, organization, social_handle, phone, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [role, full_name, email, country, organization || '', social_handle || '', phone || '', JSON.stringify(metadataObj)]
        );

        // Send Notification Email
        sendNotificationEmail(result.rows[0]);

        // Send Confirmation to Applicant
        sendApplicantRegistrationEmail(result.rows[0]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed. Email might already exist.' });
    }
});

// --- Admin Routes ---

// GET current authenticated admin's profile
app.get('/api/admin/me', authenticateAdmin, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, username, full_name, email, role, created_at FROM admins WHERE id = $1',
            [req.admin.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT update current admin's profile
app.put('/api/admin/profile', authenticateAdmin, async (req, res) => {
    const { full_name, email, username, password } = req.body;
    try {
        let result;
        if (password) {
            // Policy Check
            const policy = validatePasswordPolicy(password);
            if (!policy.valid) return res.status(400).json({ error: policy.message });

            // Reuse Check
            const isReuse = await checkPasswordReuse(req.admin.id, password);
            if (isReuse) return res.status(400).json({ error: 'Cannot reuse previous passwords' });

            const hash = await bcrypt.hash(password, 10);
            
            // Move current to history before update
            const current = await query('SELECT password_hash FROM admins WHERE id = $1', [req.admin.id]);
            if (current.rows.length > 0) {
                await query('INSERT INTO password_history (admin_id, password_hash) VALUES ($1, $2)', [req.admin.id, current.rows[0].password_hash]);
            }

            result = await query(
                'UPDATE admins SET full_name = $1, email = $2, username = $3, password_hash = $4, last_password_change = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, full_name, email, role',
                [full_name, email, username, hash, req.admin.id]
            );
        } else {
            result = await query(
                'UPDATE admins SET full_name = $1, email = $2, username = $3 WHERE id = $4 RETURNING id, username, full_name, email, role',
                [full_name, email, username, req.admin.id]
            );
        }
        if (result.rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Username or email already exists' });
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get All Admins (Superadmin only)
app.get('/api/admin/admins', authenticateAdmin, requireSuperadmin, async (req, res) => {
    try {
        const result = await query('SELECT id, username, full_name, email, role, created_at FROM admins ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

// Create Admin (Superadmin only)
app.post('/api/admin/admins', authenticateAdmin, requireSuperadmin, async (req, res) => {
    const { username, password, role } = req.body;
    try {
        // Policy Check
        const policy = validatePasswordPolicy(password);
        if (!policy.valid) return res.status(400).json({ error: policy.message });

        const hash = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
            [username, hash, role || 'admin']
        );

        await query('INSERT INTO audit_logs (admin_id, action, target_id) VALUES ($1, $2, $3)',
            [req.admin.username, 'CREATED_ADMIN', result.rows[0].id]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

// Update Admin (Superadmin only)
app.put('/api/admin/admins/:id', authenticateAdmin, requireSuperadmin, async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    try {
        let result;
        if (password) {
            // Policy Check
            const policy = validatePasswordPolicy(password);
            if (!policy.valid) return res.status(400).json({ error: policy.message });

            // Reuse Check
            const isReuse = await checkPasswordReuse(id, password);
            if (isReuse) return res.status(400).json({ error: 'Cannot reuse previous passwords' });

            const hash = await bcrypt.hash(password, 10);

            // Move current to history
            const current = await query('SELECT password_hash FROM admins WHERE id = $1', [id]);
            if (current.rows.length > 0) {
                await query('INSERT INTO password_history (admin_id, password_hash) VALUES ($1, $2)', [id, current.rows[0].password_hash]);
            }

            result = await query(
                'UPDATE admins SET username = $1, password_hash = $2, role = $3, last_password_change = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, username, role, created_at',
                [username, hash, role, id]
            );
        } else {
            result = await query(
                'UPDATE admins SET username = $1, role = $2 WHERE id = $3 RETURNING id, username, role, created_at',
                [username, role, id]
            );
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: 'Failed to update admin' });
    }
});

// Delete Admin (Superadmin only)
app.delete('/api/admin/admins/:id', authenticateAdmin, requireSuperadmin, async (req, res) => {
    const { id } = req.params;
    try {
        if (id == req.admin.id) return res.status(400).json({ error: 'Cannot delete your own account' });
        const check = await query('SELECT username FROM admins WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
        if (check.rows[0].username === 'admin') return res.status(400).json({ error: 'Cannot delete default admin' });

        await query('DELETE FROM admins WHERE id = $1', [id]);
        await query('INSERT INTO audit_logs (admin_id, action, target_id) VALUES ($1, $2, $3)',
            [req.admin.username, 'DELETED_ADMIN', id]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete admin' });
    }
});

// Register VIP (Superadmin only)
app.post('/api/admin/register-vip', authenticateAdmin, requireSuperadmin, async (req, res) => {
    const { role, full_name, email, country, organization, social_handle, phone, metadata } = req.body;

    // Phone validation (if provided)
    if (phone && !validatePhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format. Please provide a valid number (7-20 characters, digits, spaces, dashes, parentheses allowed).' });
    }

    try {
        // Check if email already exists
        const check = await query('SELECT id FROM applicants WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'This email is already registered.' });
        }

        const confirmationCode = generateConfirmationCode();
        // Approve immediately for VIPs
        const result = await query(
            "INSERT INTO applicants (role, full_name, email, country, organization, social_handle, phone, metadata, status, confirmation_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', $9) RETURNING *",
            [role, full_name, email, country, organization, social_handle, phone, JSON.stringify(metadata || {}), confirmationCode]
        );
        const applicantData = result.rows[0];

        // Generate QR
        const qrData = applicantData.confirmation_code;
        const qrImage = await QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#120e0c', light: '#ffffff' } });

        await query('UPDATE applicants SET qr_code = $1 WHERE id = $2', [qrImage, applicantData.id]);
        applicantData.qr_code = qrImage;

        await sendApplicantApprovalEmail(applicantData, qrImage, confirmationCode);
        res.status(201).json(applicantData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'VIP Registration failed.' });
    }
});

// Get All Applicants
app.get('/api/admin/applicants', authenticateAdmin, async (req, res) => {
    try {
        const { role, country } = req.query;
        let sql = 'SELECT id, role, full_name, email, country, organization, social_handle, phone, status, remark, qr_code, confirmation_code, created_at FROM applicants WHERE 1=1';
        const params = [];

        // Updated visibility: Allowing all admins to see all roles including VIPs per request
        // if (req.admin.role === 'admin') {
        //     sql += ` AND role NOT IN ('VIP', 'VVIP')`;
        // }

        if (role) {
            params.push(role);
            sql += ` AND role = $${params.length}`;
        }
        if (country) {
            params.push(country);
            sql += ` AND country = $${params.length}`;
        }

        sql += ' ORDER BY created_at DESC';
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch applicants' });
    }
});

// Get Single Applicant (for badge viewing)
app.get('/api/admin/applicants/:id', authenticateAdmin, async (req, res) => {
    try {
        const result = await query('SELECT * FROM applicants WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Applicant not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch applicant' });
    }
});

// Get Stats Grouped By Role for Chart.js
app.get('/api/admin/stats/roles', authenticateAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT role, COUNT(*) as count 
            FROM applicants 
            GROUP BY role 
            ORDER BY count DESC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch role statistics' });
    }
});

// GET Summary Stats (Total, Speakers, Impact)
app.get('/api/admin/stats/summary', authenticateAdmin, async (req, res) => {
    try {
        const totalResult = await query('SELECT COUNT(*) FROM applicants');
        const speakerResult = await query("SELECT COUNT(*) FROM applicants WHERE role = 'Speaker'");
        const partnerResult = await query("SELECT COUNT(*) FROM applicants WHERE role = 'Partner'");
        const countryResult = await query('SELECT COUNT(DISTINCT country) FROM applicants');

        const total = parseInt(totalResult.rows[0].count);
        const speakers = parseInt(speakerResult.rows[0].count);
        const partners = parseInt(partnerResult.rows[0].count);
        const countries = parseInt(countryResult.rows[0].count);

        // Impact calculation derived from database counts
        const impact = (total * 85) + (partners * 500);

        res.json({
            total_applications: total,
            total_speakers: speakers,
            estimated_impact: impact,
            total_partners: partners,
            total_countries: countries
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch summary stats' });
    }
});

// GET Country Distribution for Map
app.get('/api/admin/stats/map-distribution', authenticateAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT country, COUNT(*) as count 
            FROM applicants 
            GROUP BY country 
            ORDER BY count DESC;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch map statistics' });
    }
});

// (Old stats endpoints removed, replaced by new versions below)


// Approve Applicant & Generate QR
app.post('/api/admin/approve/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { remark } = req.body;
    try {
        // Generate QR Code data based on a unique confirmation code (string only)
        const confirmationCode = generateConfirmationCode();
        const qrImage = await QRCode.toDataURL(confirmationCode, {
            width: 300,
            margin: 2,
            color: { dark: '#120e0c', light: '#ffffff' }
        });

        const result = await query(
            'UPDATE applicants SET status = $1, remark = $2, qr_code = $3, confirmation_code = $4 WHERE id = $5 RETURNING *',
            ['approved', remark, qrImage, confirmationCode, id]
        );

        // Mock Notification
        console.log(`Notification: Applicant ${result.rows[0].email} approved with code ${confirmationCode}.`);
        sendApplicantApprovalEmail(result.rows[0], qrImage, confirmationCode);

        await query('INSERT INTO audit_logs (admin_id, action, target_id) VALUES ($1, $2, $3)',
            [req.admin.username, 'APPROVED_APPLICANT', id]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Approval failed' });
    }
});

// Reject Applicant (Superadmin only for VIP/VVIP, but allowing all admins for now as requested for general applicants)
app.post('/api/admin/reject/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { remark } = req.body;
    try {
        const result = await query(
            'UPDATE applicants SET status = $1, remark = $2 WHERE id = $3 RETURNING *',
            ['rejected', remark, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        console.log(`Notification: Applicant ${result.rows[0].email} rejected.`);
        sendApplicantRejectionEmail(result.rows[0], remark);

        await query('INSERT INTO audit_logs (admin_id, action, target_id) VALUES ($1, $2, $3)',
            [req.admin.username, 'REJECTED_APPLICANT', id]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Rejection failed' });
    }
});

// QR Scan Verification (by confirmation code)
app.get('/api/admin/verify-qr/:code', authenticateAdmin, async (req, res) => {
    const { code } = req.params;
    try {
        const result = await query('SELECT * FROM applicants WHERE confirmation_code = $1', [code]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Invalid Confirmation Code' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// One-Click Email Approval
app.get('/api/admin/approve-from-email/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Find applicant
        const applicantResult = await query('SELECT * FROM applicants WHERE id = $1', [id]);
        if (applicantResult.rows.length === 0) {
            return res.status(404).send('<h1>Error</h1><p>Applicant not found.</p>');
        }

        const applicant = applicantResult.rows[0];

        // Process Approval
        const confirmationCode = generateConfirmationCode();
        const qrImage = await QRCode.toDataURL(confirmationCode);

        await query(
            'UPDATE applicants SET status = $1, remark = $2, qr_code = $3, confirmation_code = $4 WHERE id = $5',
            ['approved', 'Approved via Email link', qrImage, confirmationCode, id]
        );

        await query('INSERT INTO audit_logs (admin_id, action, target_id) VALUES ($1, $2, $3)',
            ['email_admin', 'APPROVED_VIA_EMAIL', id]);

        sendApplicantApprovalEmail(applicant, qrImage, confirmationCode);

        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #4caf50;">✅ Successfully Approved!</h1>
                <p>The applicant <strong>${applicant.full_name}</strong> (${applicant.role}) has been approved.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
                    <p style="margin: 0; color: #666; font-size: 0.8rem;">Confirmation Code:</p>
                    <p style="margin: 5px 0 0; font-size: 1.5rem; font-weight: bold; color: #c29958;">${confirmationCode}</p>
                </div>
                <p>A QR code has been generated for their accreditation.</p>
                <hr style="width: 50px; border: 2px solid #eee; margin: 30px auto;">
                <p style="color: #666; font-size: 0.9rem;">ASMIS Web Portal Admin</p>
            </div>
        `);
    } catch (err) {
        res.status(500).send('<h1>Error</h1><p>Approval failed. Please try through the main dashboard.</p>');
    }
});

// --- PUBLIC STATS ENDPOINTS ---

// Sponsors endpoints - Fetch approved Sponsor-role applicants
app.get('/api/public/sponsors', async (req, res) => {
    try {
        const result = await query(
            "SELECT id, full_name, organization, country, metadata FROM applicants WHERE role = 'Sponsor' AND status = 'approved' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sponsors' });
    }
});

app.post('/api/admin/sponsors', authenticateAdmin, requireSuperadmin, async (req, res) => {
    const { name, logo_url, website_url } = req.body;
    try {
        const result = await query(
            'INSERT INTO sponsors (name, logo_url, website_url) VALUES ($1, $2, $3) RETURNING *',
            [name, logo_url, website_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create sponsor' });
    }
});

// Stats Summary (Impact) - Updated to include real sponsors count
app.get('/api/stats/summary', async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM applicants WHERE status = 'approved') as total_applications,
                (SELECT COUNT(DISTINCT country) FROM applicants WHERE status = 'approved') as total_countries,
                (SELECT COUNT(*) FROM applicants WHERE role = 'Speaker' AND status = 'approved') as total_speakers,
                (SELECT COUNT(*) FROM applicants WHERE role = 'Influencer' AND status = 'approved') as total_influencers,
                (SELECT COUNT(*) FROM applicants WHERE role = 'Media' AND status = 'approved') as total_media,
                (SELECT COUNT(*) FROM sponsors) as total_sponsors
        `);

        const row = stats.rows[0];
        res.json({
            total: parseInt(row.total_applications),
            countries: parseInt(row.total_countries),
            speakers: parseInt(row.total_speakers),
            influencers: parseInt(row.total_influencers),
            media: parseInt(row.total_media),
            sponsors: parseInt(row.total_sponsors)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch summary stats' });
    }
});

// Stats by Country (for Interactive Map) - Enhanced with full role breakdown
app.get('/api/stats/countries', async (req, res) => {
    const { country } = req.query;
    try {
        let sql = `
            SELECT 
                country,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE role = 'Influencer') as influencer_count,
                COUNT(*) FILTER (WHERE role = 'Media') as media_count,
                COUNT(*) FILTER (WHERE role = 'Speaker') as speaker_count,
                COUNT(*) FILTER (WHERE role = 'Partner') as partner_count,
                COUNT(*) FILTER (WHERE role = 'Sponsor') as sponsor_count,
                COUNT(*) FILTER (WHERE role = 'Public Applicant') as public_count,
                COUNT(*) FILTER (WHERE role IN ('VIP', 'VVIP')) as vip_count,
                COUNT(*) FILTER (WHERE status = 'approved' OR role IN ('VIP','VVIP')) as approved_count,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count
            FROM applicants
        `;
        const params = [];
        if (country) {
            sql += ` WHERE LOWER(country) = LOWER($1)`;
            params.push(country);
        }
        sql += ` GROUP BY country ORDER BY total DESC`;

        const result = await query(sql, params);

        if (country) {
            if (result.rows.length === 0) {
                return res.json({ country, total: 0, influencer_count: 0, media_count: 0, speaker_count: 0, partner_count: 0, sponsor_count: 0, vip_count: 0, approved_count: 0, pending_count: 0 });
            }
            const row = result.rows[0];
            return res.json({
                country: row.country,
                total: parseInt(row.total) || 0,
                influencer_count: parseInt(row.influencer_count) || 0,
                media_count: parseInt(row.media_count) || 0,
                speaker_count: parseInt(row.speaker_count) || 0,
                partner_count: parseInt(row.partner_count) || 0,
                sponsor_count: parseInt(row.sponsor_count) || 0,
                public_count: parseInt(row.public_count) || 0,
                vip_count: parseInt(row.vip_count) || 0,
                approved_count: parseInt(row.approved_count) || 0,
                pending_count: parseInt(row.pending_count) || 0
            });
        }

        // Return all countries keyed by lowercase name for flexible case-insensitive matching
        const countryStats = {};
        result.rows.forEach(row => {
            const key = (row.country || '').toLowerCase().trim();
            countryStats[key] = {
                country: row.country,
                total: parseInt(row.total) || 0,
                influencer_count: parseInt(row.influencer_count) || 0,
                media_count: parseInt(row.media_count) || 0,
                speaker_count: parseInt(row.speaker_count) || 0,
                partner_count: parseInt(row.partner_count) || 0,
                sponsor_count: parseInt(row.sponsor_count) || 0,
                public_count: parseInt(row.public_count) || 0,
                vip_count: parseInt(row.vip_count) || 0,
                approved_count: parseInt(row.approved_count) || 0,
                pending_count: parseInt(row.pending_count) || 0
            };
        });

        res.json(countryStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch country stats' });
    }
});

// Weekly Registration Growth for Admin Dashboard
app.get('/api/stats/weekly', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                TO_CHAR(d.day, 'Mon DD') as date,
                COALESCE(count(a.id), 0) as count
            FROM (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days', 
                    CURRENT_DATE, 
                    '1 day'::interval
                )::date as day
            ) d
            LEFT JOIN applicants a ON DATE(a.created_at) = d.day
            GROUP BY d.day
            ORDER BY d.day ASC
        `);

        res.json(result.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count)
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch weekly stats' });
    }
});

// All Approved Speakers for homepage carousel
app.get('/api/public/speakers', async (req, res) => {
    try {
        const result = await query(`
            SELECT full_name, organization, role, country, metadata 
            FROM applicants 
            WHERE role = 'Speaker' AND status = 'approved'
            ORDER BY full_name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch speakers' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Global Error] ${err.stack}`);
    res.status(err.status || 500).json({
        error: err.message || 'An unexpected server error occurred'
    });
});

// --- SERVER START ---

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open at http://localhost:${PORT} or your deployment URL`);
});

