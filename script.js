const API_KEY = 'pub_42e9fc3d5f024a249292caf9f3aef7f6';
const STORAGE_KEY = 'XeroidNews_Wishlist';

let currentArticles = [];
let currentLang = 'en';
let wishlist = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// --- TOAST NOTIFICATION ---
function showToast(msg, icon = "info") {
    const snack = document.getElementById("snackbar");
    const snackText = document.getElementById("snackText");
    const snackIcon = document.getElementById("snackIcon");

    if (!snack) return;
    if (snackText) snackText.innerText = msg;
    if (snackIcon) snackIcon.innerText = icon;

    snack.classList.remove('hidden');
    snack.classList.add('show');

    setTimeout(() => {
        snack.classList.remove('show');
        snack.classList.add('hidden');
    }, 3000);
}

// --- SIDEBAR TOGGLE ---
window.toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;

    const isClosed = sidebar.style.transform === 'translateX(-100%)' || sidebar.style.transform === '';

    if (isClosed) {
        sidebar.style.transform = 'translateX(0px)';
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.style.transform = 'translateX(-100%)';
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
};

// --- API FETCHING (Updated Skeleton Animation) ---
window.fetchNews = async (query = 'trending', isLoadMore = false, category = '') => {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (!isLoadMore) {
        grid.innerHTML = `
            <div class="col-span-1 md:col-span-2 h-[420px] bg-[#1e1f23] rounded-[32px] border border-white/5 animate-pulse"></div>
            <div class="h-[420px] bg-[#1e1f23] rounded-[32px] border border-white/5 animate-pulse"></div>
            <div class="h-[420px] bg-[#1e1f23] rounded-[32px] border border-white/5 animate-pulse"></div>
            <div class="h-[420px] bg-[#1e1f23] rounded-[32px] border border-white/5 animate-pulse"></div>
        `;
    }

    let targetUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&language=${currentLang}&q=${query}`;
    
    if (category) {
        targetUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&language=${currentLang}&category=${category}`;
        const title = document.getElementById('viewTitle');
        if (title) title.innerText = category.charAt(0).toUpperCase() + category.slice(1);
    }

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        if (data.results) {
            const formattedArticles = data.results.map(art => ({
                title: art.title,
                description: art.description || 'No description available.',
                content: art.content || art.description || 'Full content available at source link.',
                url: art.link,
                urlToImage: art.image_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800',
                source: { name: art.source_id || 'News' },
                publishedAt: art.pubDate
            }));

            currentArticles = isLoadMore ? [...currentArticles, ...formattedArticles] : formattedArticles;
            localStorage.setItem('xeroid_news_cache', JSON.stringify(currentArticles));
            renderHome(currentArticles);
        }
    } catch (e) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <span class="material-symbols-rounded text-6xl text-red-400">error</span>
                <p class="text-[#8e919e] mt-4 font-bold">Failed to load content.</p>
            </div>`;
    }
};

// --- UPDATED HOME GRID RENDER (M3 Featured Layout) ---
function renderHome(articles) {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (articles.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <span class="material-symbols-rounded text-6xl text-[#8e919e]">search_off</span>
                <p class="text-[#8e919e] mt-4 font-bold">No articles found.</p>
            </div>`;
        return;
    }

    grid.innerHTML = articles.map((art, index) => {
        const isFav = wishlist.some(i => i.url === art.url);
        const isFeatured = index === 0;

        return `
        <article onclick="window.goToDetails(${index})" 
                 class="${isFeatured ? 'col-span-1 md:col-span-2' : 'col-span-1'} 
                        group relative bg-[#1e1f23] hover:bg-[#25262b] border border-white/10 hover:border-[#a8c7fa]/40 
                        rounded-[32px] p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 
                        cursor-pointer shadow-lg hover:shadow-2xl">
            
            <div>
                <!-- Image Box -->
                <div class="relative w-full ${isFeatured ? 'h-64 sm:h-72' : 'h-52'} rounded-[24px] overflow-hidden bg-[#121316] mb-4">
                    <img src="${art.urlToImage}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                         onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800'"
                         alt="Article thumbnail">
                    
                    <!-- Overlay Badges -->
                    <div class="absolute top-3 left-3 flex items-center gap-2">
                        <span class="bg-[#121316]/80 backdrop-blur-md text-[#c2e7ff] text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                            ${art.source.name}
                        </span>
                        ${isFeatured ? `<span class="bg-[#004a77] text-[#c2e7ff] text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-wider flex items-center gap-1">
                            <span class="material-symbols-rounded text-xs">star</span> Lead Story
                        </span>` : ''}
                    </div>

                    <!-- Bookmark FAB -->
                    <button onclick="event.stopPropagation(); window.toggleWishlist(${index})" 
                            class="absolute top-3 right-3 w-10 h-10 rounded-full ${isFav ? 'bg-red-500 text-white' : 'bg-[#121316]/70 text-white hover:bg-black/80'} 
                                   backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-all z-20 shadow-md">
                        <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'FILL' ${isFav ? 1 : 0}">favorite</span>
                    </button>
                </div>

                <!-- Article Content -->
                <h3 class="${isFeatured ? 'text-xl sm:text-2xl' : 'text-base'} font-bold text-white group-hover:text-[#a8c7fa] leading-snug line-clamp-2 mb-2 transition-colors">
                    ${art.title}
                </h3>

                <p class="text-[#c4c6d0] text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4">
                    ${art.description}
                </p>
            </div>

            <!-- Card Action Footer -->
            <div class="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                <span class="text-[11px] font-semibold text-[#8e919e] flex items-center gap-1">
                    <span class="material-symbols-rounded text-sm">schedule</span>
                    ${art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : 'Recent'}
                </span>

                <div class="w-8 h-8 rounded-full bg-[#2b2c30] group-hover:bg-[#004a77] text-[#c2e7ff] flex items-center justify-center transition-all group-hover:translate-x-1">
                    <span class="material-symbols-rounded text-sm">arrow_forward</span>
                </div>
            </div>
        </article>`;
    }).join('');
}


// --- CATEGORY HELPERS ---
window.fetchByCategory = (cat) => {
    window.fetchNews('', false, cat);
    window.toggleMenu();
};

// --- WISHLIST LOGIC ---
window.toggleWishlist = (index) => {
    const art = currentArticles[index];
    const foundIdx = wishlist.findIndex(item => item.url === art.url);
    if (foundIdx > -1) {
        wishlist.splice(foundIdx, 1);
        showToast("Removed from Library", "delete");
    } else {
        wishlist.push(art);
        showToast("Saved to Library", "bookmark");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    updateWishlistUI();
    renderHome(currentArticles);
};

window.renderWishlist = () => {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;

    if (wishlist.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <span class="material-symbols-rounded text-6xl text-[#8e919e]">folder_off</span>
                <p class="text-[#8e919e] mt-4 font-bold text-sm">Your library is empty</p>
            </div>`;
        return;
    }

    grid.innerHTML = wishlist.map((art, i) => `
        <div class="bg-[#1e1f23] border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:bg-[#28292e] transition-all cursor-pointer relative group" 
             onclick="window.goToWishlistDetails(${i})">
            <img src="${art.urlToImage}" class="w-20 h-24 object-cover rounded-2xl flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800'">
            <div class="flex-grow pr-8">
                <span class="text-[#a8c7fa] bg-[#004a77] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-block mb-1">${art.source.name}</span>
                <h3 class="font-bold text-white text-sm line-clamp-2 leading-tight">${art.title}</h3>
            </div>
            <button onclick="event.stopPropagation(); window.removeWishlist(${i})" class="absolute right-3 p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-all">
                <span class="material-symbols-rounded text-lg">delete</span>
            </button>
        </div>`).join('');
};

window.removeWishlist = (i) => {
    wishlist.splice(i, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    window.renderWishlist();
    updateWishlistUI();
    showToast("Removed from Library", "delete");
};

// --- NAVIGATION & DETAILS ---
window.goToDetails = (index) => {
    localStorage.setItem('Xeroid_Temp_Article', JSON.stringify(currentArticles[index]));
    window.location.href = 'details.html';
};

window.goToWishlistDetails = (index) => {
    localStorage.setItem('Xeroid_Temp_Article', JSON.stringify(wishlist[index]));
    window.location.href = 'details.html';
};

window.renderDetailsPage = () => {
    const container = document.getElementById('detailsContent');
    const rawData = localStorage.getItem('Xeroid_Temp_Article');
    if (!container || !rawData) return;

    const art = JSON.parse(rawData);
    const isFav = wishlist.some(item => item.url === art.url);

    container.innerHTML = `
        <div class="bg-[#1e1f23] rounded-[36px] border border-white/10 p-4 sm:p-6 shadow-2xl">
            <div class="relative rounded-2xl overflow-hidden aspect-video mb-6 bg-[#121316]">
                <img src="${art.urlToImage}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800'">
            </div>

            <span class="bg-[#004a77] text-[#c2e7ff] text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest inline-block mb-3">
                ${art.source.name}
            </span>

            <h1 class="text-2xl font-bold text-white mb-6 leading-tight">${art.title}</h1>

            <div class="bg-[#28292e] p-4 rounded-2xl border-l-4 border-[#a8c7fa] mb-6">
                <p class="text-[#c4c6d0] text-sm italic">${art.description}</p>
            </div>

            <p class="text-[#e3e2e6] text-sm sm:text-base leading-relaxed mb-8">${art.content}</p>

            <a href="${art.url}" target="_blank" class="w-full py-4 bg-[#004a77] hover:bg-[#005b93] text-[#c2e7ff] rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all shadow-lg text-sm">
                <span class="material-symbols-rounded text-base">launch</span> Read Full Article
            </a>
        </div>`;
};

function updateWishlistUI() {
    const badge = document.getElementById('wishlistCount');
    if (badge) {
        badge.innerText = wishlist.length;
        badge.classList.toggle('hidden', wishlist.length === 0);
    }
}

// --- SHARE ---
window.shareNews = () => {
    const rawData = localStorage.getItem('Xeroid_Temp_Article');
    if (!rawData) return;
    const art = JSON.parse(rawData);
    if (navigator.share) {
        navigator.share({ title: art.title, url: art.url });
    } else {
        navigator.clipboard.writeText(art.url);
        showToast("Link copied to clipboard", "content_copy");
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsGrid')) {
        window.fetchNews('trending');
    }
    if (document.getElementById('wishlistGrid')) {
        window.renderWishlist();
    }
    if (document.getElementById('detailsContent')) {
        window.renderDetailsPage();
    }
    updateWishlistUI();
});

window.searchNews = () => window.fetchNews(document.getElementById('newsQuery').value || 'trending');
