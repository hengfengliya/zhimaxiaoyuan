// 移动端菜单控制
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// 当前页面高亮
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

// 食物数据管理
const foodRecords = {
    items: [],
    currentFilter: null,

    async init() {
        await this.loadFromR2();
        this.renderTagFilters();
        this.renderCards();
    },

    async loadFromR2() {
        try {
            const response = await fetch('http://localhost:3000/api/records'); // 注意：这里还是本地地址，需要换成 Render 地址
            if (!response.ok) {
                throw new Error('获取记录失败');
            }
            let records = await response.json();
            console.log('从 R2 加载记录:', records);

            // 处理旧记录，将 date 字段的值赋给 timestamp
            this.items = records.map(item => {
                if (!item.timestamp && item.date) {
                    item.timestamp = item.date;
                }
                return item;
            });

            // 确保按时间排序（使用 timestamp）
            this.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            console.log('加载并处理后的记录:', this.items);

        } catch (error) {
            console.error('从 R2 加载记录失败:', error);
            this.items = [];
        }
    },

    formatDate(dateInput) {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:00`;
    },

    renderCards() {
        const container = document.getElementById('food-cards');
        if (!container) return;

        console.log('开始渲染卡片，当前记录数量:', this.items.length);
        console.log('renderCards 中的 foodRecords.items:', this.items);

        if (this.items.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500">暂无记录</div>';
            return;
        }

        const cards = this.items.map(item => this.createCardHTML(item));
        container.innerHTML = cards.join('');
    },

    createCardHTML(item) {
        const coverImage = item.images.find(img => img.isCover)?.url || item.images[0]?.url;
        
        const uploadDate = new Date(item.timestamp); // 尝试解析 timestamp

        // 检查日期对象是否有效
        const displayTime = uploadDate instanceof Date && !isNaN(uploadDate) 
            ? this.formatDate(uploadDate) // 将 uploadDate 对象传递给 formatDate
            : 'Invalid Date';

        return `
            <div class="food-card group cursor-pointer" data-id="${item.id}" onclick="foodRecords.viewDetail('${item.id}')">
                <div class="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <img src="${coverImage}" 
                         alt="${item.title}" 
                         class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300">
                </div>
                <div class="p-4">
                    <h3 class="text-base font-semibold mb-1">${item.title}</h3>
                    <time class="block text-sm text-gray-500 italic mb-2">${displayTime}</time>
                    <p class="text-sm text-gray-500 italic mb-2">${item.description}</p>
                    <div class="flex flex-wrap gap-2">
                        ${(item.tags || []).map(tag => 
                            `<span class="tag-glass-static">${tag}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // 删除记录
    async deleteRecord(id, redirectUrl = null) {
        if (!confirm('确定要删除这条记录吗？')) return;
        
        try {
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.classList.add('scale-0', 'opacity-0');
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            console.log(`尝试删除记录 ID: ${id}`);
            console.log('删除前 foodRecords.items:', this.items);
            console.log('删除前记录数量:', this.items.length);

            const response = await fetch(`http://localhost:3000/api/records/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('删除失败');
            }
            
            console.log('后端删除接口返回成功。');
            
            this.items = this.items.filter(item => item.id !== id);
            console.log('删除后 foodRecords.items:', this.items);
            console.log('删除后记录数量:', this.items.length);

            if (redirectUrl) {
                alert('删除成功！即将跳转回首页...');
                window.location.href = redirectUrl;
            } else {
                this.renderCards();
                alert('删除成功！');
            }
            
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败: ' + error.message);
        }
    },

    // 查看详情
    viewDetail(id) {
        try {
            console.log('查看详情:', id);
            const item = this.items.find(item => item.id === id);
            if (!item) {
                throw new Error('未找到记录');
            }

            // 存储当前记录到 sessionStorage
            sessionStorage.setItem('currentRecord', JSON.stringify(item));
            
            // 计算详情页路径
            const basePath = window.location.pathname.includes('index.html') ? '' : './';
            const detailPath = `${basePath}views/detail.html`;
            
            console.log('跳转到:', detailPath);
            window.open(detailPath, '_blank');
        } catch (error) {
            console.error('跳转失败:', error);
            alert('查看详情失败: ' + error.message);
        }
    },

    // 搜索功能
    search(keyword) {
        const filtered = this.items.filter(item => 
            item.title.includes(keyword) || 
            item.description.includes(keyword) ||
            item.tags.some(tag => tag.includes(keyword))
        );
        const container = document.getElementById('food-cards');
        container.innerHTML = filtered.map(item => this.createCardHTML(item)).join('');
    },

    // 添加排序方法
    sortByDate() {
        this.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.renderCards();
    },

    // 统计所有标签及其出现次数
    getTagStats() {
        const tagCount = {};
        this.items.forEach(item => {
            item.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });
        return Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({ tag, count }));
    },

    // 渲染标签筛选器
    renderTagFilters() {
        const container = document.getElementById('tag-filters');
        if (!container) return;

        const tags = this.getTagStats();
        const allButton = `<button class="${!this.currentFilter ? 'btn-glass' : 'px-4 py-2 rounded-[0.375rem] text-base bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-all"
                    onclick="foodRecords.filterByTag(null)">
                全部
            </button>`;

        const tagButtons = tags.map(({ tag, count }) => `
            <button class="${this.currentFilter === tag ? 'btn-glass' : 'px-4 py-2 rounded-[0.375rem] text-base bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-all"
                    onclick="foodRecords.filterByTag('${tag}')">
                ${tag} (${count})
            </button>
        `).join('');

        container.innerHTML = allButton + tagButtons;
    },

    // 根据标签筛选记录
    filterByTag(tag) {
        this.currentFilter = tag;
        const container = document.getElementById('food-cards');
        if (!container) return;

        const filteredItems = tag 
            ? this.items.filter(item => item.tags.includes(tag))
            : this.items;

        container.innerHTML = filteredItems.map(item => this.createCardHTML(item)).join('');
        this.renderTagFilters();
    }
};

// 将 foodRecords 对象暴露到全局作用域，以便其他脚本可以访问
window.foodRecords = foodRecords;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    highlightCurrentPage();
    foodRecords.init();
    
    // 搜索功能
    const searchInput = document.querySelector('input[type="search"]');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            foodRecords.search(e.target.value);
        }, 300);
    });
});
