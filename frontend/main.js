// Countdown Timer
const d = new Date();
d.setMonth(d.getMonth() + 1);
const targetDate = d.getTime();
const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const dEl = document.getElementById('days');
    const hEl = document.getElementById('hours');
    const mEl = document.getElementById('minutes');
    const sEl = document.getElementById('seconds');

    if (dEl) dEl.innerText = days.toString().padStart(2, '0');
    if (hEl) hEl.innerText = hours.toString().padStart(2, '0');
    if (mEl) mEl.innerText = minutes.toString().padStart(2, '0');
    if (sEl) sEl.innerText = seconds.toString().padStart(2, '0');
};

setInterval(updateCountdown, 1000);
updateCountdown();

// Interactive SVG Map Logic — Real-Time DB Stats on Hover
document.addEventListener('DOMContentLoaded', () => {
    const tooltip = document.getElementById('map-tooltip');
    const regions = document.querySelectorAll('.map-region');

    if (!tooltip || regions.length === 0) return;

    // Cache to avoid refetching the same country repeatedly
    const cache = {};
    let fetchTimeout = null;
    let currentCountry = null;

    // Show loading tooltip immediately
    const showLoadingTooltip = (countryName, x, y) => {
        tooltip.innerHTML = `
            <div style="background: rgba(13,10,8,0.97); border: 1px solid rgba(194,153,88,0.5); padding: 16px 20px; border-radius: 12px; min-width: 210px; box-shadow: 0 15px 40px rgba(0,0,0,0.7);">
                <h4 style="color: var(--primary); margin: 0 0 12px 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(194,153,88,0.2); padding-bottom: 8px;">
                    ${countryName}
                </h4>
                <div style="display: flex; align-items: center; gap: 10px; color: #888; font-size: 0.8rem;">
                    <span style="width: 16px; height: 16px; border: 2px solid var(--primary); border-top-color: transparent; border-radius: 50%; display: inline-block; animation: mapSpin 0.6s linear infinite;"></span>
                    Loading live data...
                </div>
            </div>`;
        tooltip.style.opacity = '1';
        tooltip.style.left = (x + 15) + 'px';
        tooltip.style.top = (y + 15) + 'px';
    };

    // Render full stats tooltip
    const renderTooltip = (countryName, stats, x, y) => {
        const hasData = stats.total > 0;

        const statRow = (icon, label, value, color = '#ccc') => value > 0 ? `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; padding: 3px 0;">
                <span style="color: #888;">${icon} ${label}</span>
                <span style="font-weight: 700; color: ${color}; background: rgba(255,255,255,0.05); padding: 1px 7px; border-radius: 10px;">${value}</span>
            </div>` : '';

        // Progress bar for approved ratio
        const approvedPct = hasData ? Math.round((stats.approved_count / stats.total) * 100) : 0;

        tooltip.innerHTML = `
            <div style="background: rgba(13,10,8,0.97); border: 1px solid rgba(194,153,88,0.4); padding: 16px 18px; border-radius: 12px; min-width: 220px; max-width: 280px; box-shadow: 0 15px 40px rgba(0,0,0,0.7); backdrop-filter: blur(20px);">
                <h4 style="color: var(--primary); margin: 0 0 4px 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 2px;">${countryName}</h4>

                ${hasData ? `
                    <!-- Total badge -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(194,153,88,0.15); padding-bottom: 10px;">
                        <span style="color: #666; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Total Registrations</span>
                        <span style="font-size: 1.5rem; font-weight: 900; color: #fff; line-height: 1;">${stats.total}</span>
                    </div>

                    <!-- Role breakdown -->
                    <div style="display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px;">
                        ${statRow('📢', 'Influencers', stats.influencer_count, '#c29958')}
                        ${statRow('📷', 'Media', stats.media_count, '#a0c4ff')}
                        ${statRow('🎤', 'Speakers', stats.speaker_count, '#b8f5b8')}
                        ${statRow('🤝', 'Partners', stats.partner_count, '#ffd6a5')}
                        ${statRow('💎', 'Sponsors', stats.sponsor_count, '#caffbf')}
                        ${statRow('🌍', 'Public Applicants', stats.public_count, '#bdb2ff')}
                        ${statRow('👑', 'VIP / VVIP', stats.vip_count, '#ffadad')}
                    </div>

                    <!-- Approved / Pending bar -->
                    <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 5px;">
                            <span style="color: #4caf91;">✓ Approved: ${stats.approved_count}</span>
                            <span style="color: #c29958;">⏳ Pending: ${stats.pending_count}</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.08); border-radius: 20px; height: 5px; overflow: hidden;">
                            <div style="width: ${approvedPct}%; height: 100%; background: linear-gradient(90deg, #4caf91, #c29958); border-radius: 20px; transition: width 0.5s ease;"></div>
                        </div>
                        <div style="text-align: right; font-size: 0.65rem; color: #555; margin-top: 3px;">${approvedPct}% approved</div>
                    </div>
                ` : `
                    <div style="color: #555; font-size: 0.8rem; font-style: italic; margin-top: 8px; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">
                        No registrations from this country yet.
                    </div>
                `}
            </div>`;

        tooltip.style.opacity = '1';
        tooltip.style.left = (x + 15) + 'px';
        tooltip.style.top = (y + 15) + 'px';
    };

    // Fetch stats for one country (with cache)
    const fetchCountryStats = async (countryName, x, y) => {
        const key = countryName.toLowerCase().trim();

        if (cache[key] !== undefined) {
            renderTooltip(countryName, cache[key], x, y);
            return;
        }

        try {
            const res = await fetch(`/api/stats/countries?country=${encodeURIComponent(countryName)}`);
            if (res.ok) {
                const data = await res.json();
                cache[key] = data;
                // Only render if this country is still hovered
                if (currentCountry === countryName) {
                    renderTooltip(countryName, data, x, y);
                }
            }
        } catch (err) {
            console.warn(`Failed to fetch stats for ${countryName}:`, err);
            cache[key] = { total: 0, influencer_count: 0, media_count: 0, speaker_count: 0, partner_count: 0, sponsor_count: 0, public_count: 0, vip_count: 0, approved_count: 0, pending_count: 0 };
            if (currentCountry === countryName) {
                renderTooltip(countryName, cache[key], x, y);
            }
        }
    };

    regions.forEach(region => {
        region.addEventListener('mouseenter', (e) => {
            const countryName = region.getAttribute('data-country');
            currentCountry = countryName;

            showLoadingTooltip(countryName, e.clientX, e.clientY);

            // Slight debounce to prevent spam on quick mouse-over
            clearTimeout(fetchTimeout);
            fetchTimeout = setTimeout(() => {
                fetchCountryStats(countryName, e.clientX, e.clientY);
            }, 120);
        });

        region.addEventListener('mousemove', (e) => {
            // Keep tooltip following cursor
            if (tooltip.style.opacity === '1') {
                let left = e.clientX + 20;
                let top = e.clientY + 15;
                // Prevent going off right edge
                if (left + 290 > window.innerWidth) left = e.clientX - 295;
                // Prevent going off bottom edge
                if (top + 280 > window.innerHeight) top = e.clientY - 285;
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
        });

        region.addEventListener('mouseleave', () => {
            currentCountry = null;
            clearTimeout(fetchTimeout);
            tooltip.style.opacity = '0';
        });
    });

    // Add spin keyframe to page if not already present
    if (!document.getElementById('mapSpinStyle')) {
        const style = document.createElement('style');
        style.id = 'mapSpinStyle';
        style.textContent = `@keyframes mapSpin { to { transform: rotate(360deg); } }
        #map-tooltip { pointer-events: none; transition: opacity 0.2s ease; }`;
        document.head.appendChild(style);
    }
});

// Dynamic Impact Stats Fetch
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const BACKEND_URL = 'https://web-12h1.onrender.com';
        const response = await fetch(`${BACKEND_URL}/api/stats/summary`);
        if (response.ok) {
            const data = await response.json();
            const statItems = document.querySelectorAll('.stat-number');

            statItems.forEach(el => {
                const label = el.nextElementSibling.innerText.trim().toLowerCase();
                let target = 0;
                if (label.includes('countries')) {
                    target = data.countries;
                } else if (label.includes('influencers')) {
                    target = data.influencers;
                } else if (label.includes('speakers')) {
                    target = data.speakers;
                } else if (label.includes('media')) {
                    target = data.media;
                } else if (label.includes('sponsors')) {
                    target = data.sponsors;
                }
                
                el.setAttribute('data-target', target);
                
                // If it's already in view, trigger re-animation or direct update
                if (el.classList.contains('counted')) {
                    el.innerText = target + '+';
                }
            });
        }
    } catch (err) {
        console.warn('Failed to fetch impact stats');
    }
});



// Animated Statistics Counting
document.addEventListener('DOMContentLoaded', () => {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length === 0) return;

    const countUp = (el) => {
        const target = parseInt(el.getAttribute('data-target'));
        if (target === 0) {
            el.innerText = '0+';
            return;
        }
        
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 2000; // 2 seconds
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameDuration);

        // Easing function: easeOutQuad
        const easeOutQuad = (t) => t * (2 - t);

        let frame = 0;
        const timer = setInterval(() => {
            frame++;
            const progress = easeOutQuad(frame / totalFrames);
            const currentValue = Math.round(target * progress);

            if (suffix === 'K') {
                el.innerText = (currentValue / 1000).toFixed(1) + suffix + '+';
            } else {
                el.innerText = currentValue + '+';
            }

            if (frame === totalFrames) {
                clearInterval(timer);
                el.classList.add('counted');
            }
        }, frameDuration);
        
        el.timer = timer;
    };

    const observerOptions = {
        threshold: 0.1
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                countUp(entry.target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => statsObserver.observe(stat));
});

// Sequential Schedule Item Reveal
document.addEventListener('DOMContentLoaded', () => {
    const revealItems = (section) => {
        console.log('REVEALING ITEMS');
        const scheduleItems = document.querySelectorAll('.schedule-item');
        scheduleItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });
    };

    const scheduleSection = document.getElementById('events');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                revealItems(entry.target);
            }
        });
    }, { threshold: 0.1 });

    if (scheduleSection) observer.observe(scheduleSection);
});

// Mobile Dropdown Tap Logic
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('.nav-dropdown');

    dropdowns.forEach(dropdown => {
        // Find the "EVENTS ▾" link trigger
        const trigger = dropdown.querySelector('a');

        trigger.addEventListener('click', (e) => {
            // If it's a touch device, toggle the hover class instead of following the link immediately
            if (window.matchMedia("(hover: none)").matches || window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active-mobile');
            }
        });
    });

    // Close dropdowns when tapping outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            dropdowns.forEach(d => d.classList.remove('active-mobile'));
        }
    });
});
// Dynamic Speaker Carousel — All Approved Speakers, 3 at a Time
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('speakersGrid');
    const prevBtn = document.getElementById('speakerPrev');
    const nextBtn = document.getElementById('speakerNext');
    if (!grid) return;

    const ITEMS_PER_PAGE = 3;
    let currentPage = 0;
    let speakersData = [];
    let totalPages = 0;

    // --- Render carousel position & button state ---
    const renderCarousel = () => {
        totalPages = Math.ceil(speakersData.length / ITEMS_PER_PAGE);

        // Get the live width of one card + gap from the DOM
        const firstCard = grid.querySelector('.speaker-card');
        const gridGap = 40; // must match CSS gap
        const cardWidth = firstCard
            ? firstCard.getBoundingClientRect().width
            : (grid.getBoundingClientRect().width - gridGap * 2) / 3;

        // Shift the grid left by (page * (cardWidth + gap)) for each page
        const shiftPx = currentPage * (cardWidth + gridGap);
        grid.style.transform = `translateX(-${shiftPx}px)`;

        // Show / hide buttons
        if (prevBtn) prevBtn.style.display = currentPage > 0 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = currentPage < totalPages - 1 ? 'flex' : 'none';

        // Update page indicator
        const indicator = document.getElementById('speakerPageIndicator');
        if (indicator && totalPages > 1) {
            indicator.textContent = `${currentPage + 1} / ${totalPages}`;
        }
    };

    // --- Build speaker card HTML ---
    const buildCard = (speaker) => {
        let meta = {};
        try {
            meta = typeof speaker.metadata === 'string' ? JSON.parse(speaker.metadata) : (speaker.metadata || {});
        } catch (e) {
            console.error('Meta parse error for speaker:', speaker.full_name, e);
        }

        const profilePhoto = meta.profile_photo || null;
        const initials = (speaker.full_name || '?')
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

        return `
            <div class="speaker-card glass-panel" style="overflow: hidden; padding: 0 !important;">
                <div class="speaker-image-container" style="
                    width: 100%; 
                    height: 280px; 
                    background: #1a1410; 
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    ${profilePhoto ? `
                        <img src="${profilePhoto}" 
                             alt="${speaker.full_name}" 
                             onerror="this.style.setProperty('display', 'none', 'important'); this.nextElementSibling.style.setProperty('display', 'flex', 'important');"
                             style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
                        <div class="speaker-initial-circle" style="
                            display: none !important;
                            width: 120px; 
                            height: 120px; 
                            background: linear-gradient(135deg, var(--primary), #8a6b3a);
                            color: #000;
                            border-radius: 50%;
                            align-items: center;
                            justify-content: center;
                            font-size: 3.5rem;
                            font-weight: 900;
                            box-shadow: 0 10px 20px rgba(0,0,0,0.4);
                        ">${initials}</div>
                    ` : `
                        <div class="speaker-initial-circle" style="
                            width: 120px; 
                            height: 120px; 
                            background: linear-gradient(135deg, var(--primary), #8a6b3a);
                            color: #000;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 3.5rem;
                            font-weight: 900;
                            box-shadow: 0 10px 20px rgba(0,0,0,0.4);
                        ">${initials}</div>
                    `}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 100px; background: linear-gradient(to top, rgba(18, 14, 12, 1), transparent);"></div>
                </div>
                
                <div class="speaker-info" style="padding: 20px 30px 40px; position: relative; margin-top: -30px; z-index: 2;">
                    <h3 class="speaker-name" style="margin-bottom: 5px;">${speaker.full_name}</h3>
                    <p class="speaker-role-tag" style="margin-bottom: 10px;">${speaker.role}</p>
                    <p class="speaker-org" style="color:#888; font-size:0.9rem; border-top: 1px solid rgba(194,153,88,0.15); padding-top: 10px;">${speaker.organization || 'Independent'}</p>
                    <div class="speaker-footer" style="margin-top:20px; color:var(--primary); font-size:0.8rem; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
                        <i class="fa-solid fa-location-dot" style="margin-right:5px;"></i>${speaker.country}
                    </div>
                </div>
            </div>`;
    };

    // --- Fetch all speakers ---
    try {
        const response = await fetch(`/api/public/speakers?t=${Date.now()}`);
        if (response.ok) {
            speakersData = await response.json();

            if (speakersData.length > 0) {
                grid.innerHTML = speakersData.map(buildCard).join('');
                totalPages = Math.ceil(speakersData.length / ITEMS_PER_PAGE);

                // Inject page indicator between buttons
                const wrapper = document.querySelector('.speakers-carousel-wrapper');
                if (wrapper && !document.getElementById('speakerPageIndicator') && totalPages > 1) {
                    const indicator = document.createElement('div');
                    indicator.id = 'speakerPageIndicator';
                    indicator.style.cssText = `
                        position:absolute; bottom:-35px; left:50%; transform:translateX(-50%);
                        color:#666; font-size:0.8rem; letter-spacing:2px; user-select:none;
                    `;
                    wrapper.style.position = 'relative';
                    wrapper.appendChild(indicator);
                }

                // Initial render (waits for layout)
                requestAnimationFrame(() => renderCarousel());
            } else {
                grid.innerHTML = '<p style="text-align:center; color:#666; width:100%; padding:40px 0;">No approved speakers yet. Check back soon!</p>';
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }
        }
    } catch (err) {
        console.warn('Failed to fetch speakers:', err);
        grid.innerHTML = '<p style="text-align:center; color:#666; width:100%; padding:40px 0;">Unable to load speakers.</p>';
    }

    // --- Arrow controls ---
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                renderCarousel();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            totalPages = Math.ceil(speakersData.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages - 1) {
                currentPage++;
                renderCarousel();
            }
        });
    }

    // --- Keyboard navigation ---
    document.addEventListener('keydown', (e) => {
        const section = document.getElementById('speakers');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;
        if (e.key === 'ArrowLeft' && currentPage > 0) { currentPage--; renderCarousel(); }
        if (e.key === 'ArrowRight' && currentPage < Math.ceil(speakersData.length / ITEMS_PER_PAGE) - 1) { currentPage++; renderCarousel(); }
    });

    // --- Touch / swipe support ---
    let touchStartX = 0;
    grid.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    grid.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            totalPages = Math.ceil(speakersData.length / ITEMS_PER_PAGE);
            if (diff > 0 && currentPage < totalPages - 1) { currentPage++; renderCarousel(); }
            if (diff < 0 && currentPage > 0) { currentPage--; renderCarousel(); }
        }
    }, { passive: true });

    // Fetch Dynamic Sponsors from DB (approved Sponsor-role applicants)
    const sponsorsTrack = document.getElementById('sponsorsTrack');
    if (sponsorsTrack) {
        console.log('Sponsor track found, initiating fetch...');
        try {
            const response = await fetch(`/api/public/sponsors?t=${Date.now()}`);
            if (response.ok) {
                const sponsors = await response.json();
                console.log('Sponsors data received:', sponsors);
                
                if (sponsors && Array.isArray(sponsors) && sponsors.length > 0) {
                    // Repeat items to ensure smooth infinite loop with no blank gaps
                    // We need at least enough items to fill twice the screen width
                    let displaySponsors = [...sponsors];
                    while (displaySponsors.length < 20) {
                        displaySponsors = [...displaySponsors, ...sponsors];
                    }
                    // Final duplication for seamless translateX(-50%) loop
                    displaySponsors = [...displaySponsors, ...displaySponsors];
                    
                    sponsorsTrack.innerHTML = displaySponsors.map((sponsor, index) => {
                        if (!sponsor) return '';
                        
                        // 1. Get Company Name with strict fallbacks
                        let name = 'ASMIS Partner';
                        if (sponsor.organization && sponsor.organization !== 'undefined' && sponsor.organization !== 'null') {
                            name = sponsor.organization;
                        } else if (sponsor.full_name && sponsor.full_name !== 'undefined' && sponsor.full_name !== 'null') {
                            name = sponsor.full_name;
                        }

                        // 2. Parse Metadata safely
                        let meta = {};
                        try {
                            if (typeof sponsor.metadata === 'string') {
                                meta = JSON.parse(sponsor.metadata);
                            } else if (sponsor.metadata && typeof sponsor.metadata === 'object') {
                                meta = sponsor.metadata;
                            }
                        } catch (e) {
                            console.error('Meta parse error for sponsor:', sponsor.id, e);
                        }

                        // 3. Robust Logo Logic
                        const rawLogo = meta.logo_url || meta.org_profile || meta.company_logo || null;
                        let logoUrl = null;
                        
                        // Only treat as valid if it looks like a real path/URL
                        if (rawLogo && typeof rawLogo === 'string' && rawLogo.length > 5 && 
                            rawLogo !== 'undefined' && rawLogo !== 'null' && (
                            rawLogo.match(/\.(jpg|jpeg|png|gif|svg|webp)/i) || 
                            rawLogo.startsWith('data:image') || 
                            rawLogo.startsWith('http') || 
                            rawLogo.startsWith('/uploads/')
                        )) {
                            logoUrl = rawLogo;
                        }

                        // 4. Render HTML
                        return `
                        <div class="sponsors-slide" style="display: flex; gap: 60px; align-items: center; padding: 0 30px;" data-id="${sponsor.id || index}">
                            <div class="sponsor-logo-card" style="
                                min-width: 200px; 
                                height: 110px; 
                                background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); 
                                border: 1px solid rgba(194,153,88,0.2) !important; 
                                border-radius: 15px; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                padding: 25px;
                                backdrop-filter: blur(10px);
                                transition: all 0.4s ease;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                            ">
                                ${logoUrl ? `
                                    <img src="${logoUrl}" 
                                         alt="${name}" 
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                                         style="max-width: 100%; max-height: 100%; object-fit: contain; filter: grayscale(1) brightness(1.8);">
                                    <span style="display: none; color: #d4a95a; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; font-size: 1.1rem; text-align: center;">${name}</span>
                                ` : `
                                    <span style="
                                        color: #d4a95a; 
                                        font-weight: 800; 
                                        letter-spacing: 3px; 
                                        text-transform: uppercase; 
                                        font-size: 1.1rem; 
                                        text-align: center;
                                        line-height: 1.2;
                                        text-shadow: 0 0 15px rgba(212, 169, 90, 0.4);
                                    ">${name}</span>
                                `}
                            </div>
                        </div>`;
                    }).join('');
                } else {
                    console.log('No approved sponsors found in the list.');
                }
            } else {
                console.error('Sponsor API responded with status:', response.status);
            }
        } catch (err) {
            console.error('Critical failure fetching sponsors:', err);
        }
    }

    // Re-render on resize so card widths recalculate
    window.addEventListener('resize', () => renderCarousel());
});

