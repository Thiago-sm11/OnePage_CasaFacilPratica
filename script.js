/* ========================================================
   CONFIGURAÇÃO DO REPOSITÓRIO GITHUB (BANCO DE DADOS)
======================================================== */
const GITHUB_OWNER = 'Thiago-sm11';
const GITHUB_REPO = 'OnePage_CasaFacilPratica';
const GITHUB_FILE_PATH = 'produtos.json';
const GITHUB_BRANCH = 'main';

let productsList = [];
let currentFileSha = '';

/* ========================================================
   FUNÇÕES AUXILIARES DE VISUAL DE LOJA
======================================================== */
function getStoreInfo(store) {
    switch (store) {
        case 'shopee':
            return {
                badge: '<span class="badge-store badge-shopee"><i class="fa-solid fa-bag-shopping"></i> Shopee</span>',
                btnText: 'Ver Oferta na Shopee'
            };
        case 'shein':
            return {
                badge: '<span class="badge-store badge-shein"><i class="fa-solid fa-shirt"></i> SHEIN</span>',
                btnText: 'Ver Oferta na SHEIN'
            };
        case 'mercadolivre':
            return {
                badge: '<span class="badge-store badge-mercadolivre"><i class="fa-solid fa-handshake"></i> Mercado Livre</span>',
                btnText: 'Ver no Mercado Livre'
            };
        case 'amazon':
            return {
                badge: '<span class="badge-store badge-amazon"><i class="fa-brands fa-amazon"></i> Amazon</span>',
                btnText: 'Ver Oferta na Amazon'
            };
        case 'temu':
            return {
                badge: '<span class="badge-store badge-temu"><i class="fa-solid fa-gift"></i> Temu</span>',
                btnText: 'Ver Oferta na Temu'
            };
        default:
            return {
                badge: `<span class="badge-store bg-dark text-white">${store}</span>`,
                btnText: 'Ver Oferta'
            };
    }
}

/* ========================================================
   CARREGAR PRODUTOS DO ARQUIVO produtos.json
======================================================== */
async function loadProducts() {
    try {
        // Evita cache do navegador para pegar sempre a versão mais recente
        const response = await fetch(`${GITHUB_FILE_PATH}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Erro ao carregar produtos.json');
        productsList = await response.json();

        // Renderiza na vitrine pública (se estiver no index.html)
        if (document.getElementById('productsGrid')) {
            renderPublicProducts(productsList);
        }

        // Renderiza na tabela do admin (se estiver no admin.html)
        if (document.getElementById('adminProductsTable')) {
            renderAdminTable(productsList);
        }
    } catch (error) {
        console.error(error);
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = '<div class="col-12 text-center text-danger py-4">Erro ao carregar os achadinhos. Verifique se o arquivo produtos.json está no repositório.</div>';
        }
    }
}

/* ========================================================
   VITRINE PÚBLICA (index.html)
======================================================== */
function renderPublicProducts(items) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-4">Nenhum achadinho cadastrado no momento.</div>';
        return;
    }

    grid.innerHTML = items.map(prod => {
        const storeInfo = getStoreInfo(prod.store);
        const categoryCap = prod.category.charAt(0).toUpperCase() + prod.category.slice(1);
        const searchTerms = `${prod.title} ${prod.category} ${prod.store} ${prod.description}`.toLowerCase();

        return `
            <div class="col-sm-6 col-lg-4 product-item" data-category="${prod.category}" data-store="${prod.store}" data-title="${searchTerms}">
                <div class="product-card">
                    <div class="product-img-wrapper">
                        <span class="badge-category">${categoryCap}</span>
                        ${storeInfo.badge}
                        <img src="${prod.img}" alt="${prod.title}" onerror="this.src='https://placehold.co/600x400/2cb5c4/ffffff?text=Achadinho'">
                    </div>
                    <div class="card-body p-4 text-center">
                        <div class="text-warning mb-2"><i class="fa-solid fa-star"></i> ${prod.rating || '5.0'}</div>
                        <h5 class="card-title fw-bold">${prod.title}</h5>
                        <p class="card-text text-muted small">${prod.description}</p>
                        <div class="fs-4 fw-bold text-success mb-3">R$ ${prod.price}</div>
                        <a href="${prod.url}" target="_blank" class="btn btn-custom-turquoise w-100">
                            <i class="fa-solid fa-arrow-up-right-from-square me-2"></i> ${storeInfo.btnText}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* ========================================================
   PAINEL ADMINISTRATIVO & API DO GITHUB (admin.html)
======================================================== */
function saveGithubToken() {
    const token = document.getElementById('githubTokenInput').value.trim();
    if (token) {
        localStorage.setItem('github_pat', token);
        updateTokenStatus();
        alert('Token salvo neste navegador com sucesso!');
    }
}

function updateTokenStatus() {
    const statusEl = document.getElementById('tokenStatus');
    const tokenInput = document.getElementById('githubTokenInput');
    if (!statusEl) return;

    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) {
        statusEl.innerHTML = '<span class="text-success fw-semibold"><i class="fa-solid fa-circle-check me-1"></i> Token configurado e pronto para salvar no GitHub!</span>';
        if (tokenInput) tokenInput.value = savedToken;
    } else {
        statusEl.innerHTML = '<span class="text-danger fw-semibold"><i class="fa-solid fa-triangle-exclamation me-1"></i> Nenhum Token configurado. Cole seu Token acima para poder salvar alterações.</span>';
    }
}

async function syncWithGithub(updatedList) {
    const token = localStorage.getItem('github_pat');
    if (!token) {
        alert('Por favor, cole e salve seu Personal Access Token do GitHub no topo da página antes de salvar alterações.');
        return false;
    }

    const badge = document.getElementById('syncStatusBadge');
    if (badge) {
        badge.className = 'badge bg-warning-subtle text-warning';
        badge.textContent = 'Salvando no GitHub...';
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

    try {
        // 1. Buscar o SHA atual do arquivo no GitHub
        const getRes = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!getRes.ok) {
            throw new Error('Token inválido ou sem permissão no repositório.');
        }

        const fileData = await getRes.json();
        currentFileSha = fileData.sha;

        // 2. Converter JSON para Base64 suportando acentos (UTF-8)
        const jsonString = JSON.stringify(updatedList, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

        // 3. Enviar atualização (PUT) para o GitHub
        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Atualização de achadinhos via Painel Admin',
                content: base64Content,
                sha: currentFileSha,
                branch: GITHUB_BRANCH
            })
        });

        if (!putRes.ok) {
            throw new Error('Falha ao gravar arquivo no GitHub.');
        }

        productsList = updatedList;
        renderAdminTable(productsList);

        if (badge) {
            badge.className = 'badge bg-success-subtle text-success';
            badge.textContent = 'Salvo no GitHub!';
        }

        alert('Alterações salvas com sucesso no GitHub! O site público será atualizado automaticamente em cerca de 30 segundos.');
        return true;

    } catch (error) {
        console.error(error);
        if (badge) {
            badge.className = 'badge bg-danger-subtle text-danger';
            badge.textContent = 'Erro ao salvar';
        }
        alert('Erro ao salvar no GitHub: ' + error.message);
        return false;
    }
}

function renderAdminTable(items) {
    const tbody = document.getElementById('adminProductsTable');
    const countEl = document.getElementById('totalProductsCount');
    if (!tbody) return;

    if (countEl) countEl.textContent = items.length;

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhum produto cadastrado.</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(prod => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${prod.img}" alt="${prod.title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px;" onerror="this.src='https://placehold.co/100x100?text=Foto'">
                    <div>
                        <div class="fw-bold small">${prod.title}</div>
                        <a href="${prod.url}" target="_blank" class="text-muted small text-decoration-none"><i class="fa-solid fa-link"></i> Ver link</a>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-secondary-subtle text-dark text-uppercase">${prod.store}</span><br>
                <span class="small text-muted">${prod.category}</span>
            </td>
            <td class="fw-bold text-success">R$ ${prod.price}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" title="Editar" onclick="editProduct(${prod.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" title="Excluir" onclick="deleteProduct(${prod.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function editProduct(id) {
    const prod = productsList.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('editProductId').value = prod.id;
    document.getElementById('prodTitle').value = prod.title;
    document.getElementById('prodCategory').value = prod.category;
    document.getElementById('prodStore').value = prod.store;
    document.getElementById('prodPrice').value = prod.price;
    document.getElementById('prodRating').value = prod.rating || '5.0';
    document.getElementById('prodDesc').value = prod.description;
    document.getElementById('prodImg').value = prod.img;
    document.getElementById('prodUrl').value = prod.url;

    document.getElementById('formTitle').textContent = '✏️ Editar Achadinho';
    document.getElementById('saveProdBtn').innerHTML = '<i class="fa-solid fa-check me-1"></i> Atualizar Achadinho';
    document.getElementById('cancelEditBtn').classList.remove('d-none');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetAdminForm() {
    const form = document.getElementById('adminProductForm');
    if (form) form.reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('formTitle').textContent = '➕ Novo Achadinho';
    document.getElementById('saveProdBtn').innerHTML = '<i class="fa-solid fa-cloud-arrow-up me-1"></i> Salvar e Publicar no Site';
    document.getElementById('cancelEditBtn').classList.add('d-none');
}

async function deleteProduct(id) {
    const prod = productsList.find(p => p.id === id);
    if (!prod) return;

    if (confirm(`Tem certeza que deseja excluir "${prod.title}"?`)) {
        const updated = productsList.filter(p => p.id !== id);
        await syncWithGithub(updated);
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('vania_admin_auth');
    location.reload();
}

/* ========================================================
   INICIALIZAÇÃO GERAL (DOMContentLoaded)
======================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os produtos do JSON em ambas as páginas
    loadProducts();

    // 1. DARK MODE TOGGLE (index.html)
    const checkboxToggle = document.getElementById('checkboxToggle');
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-bs-theme', 'dark');
        if (checkboxToggle) checkboxToggle.checked = true;
    }

    if (checkboxToggle) {
        checkboxToggle.addEventListener('change', () => {
            if (checkboxToggle.checked) {
                htmlElement.setAttribute('data-bs-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                htmlElement.setAttribute('data-bs-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // 2. FILTROS E BUSCA (index.html)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const selectedFilterText = document.getElementById('selectedFilterText');

    function applyFilters() {
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'todos';
        const searchText = searchInput ? searchInput.value.toLowerCase() : '';
        const productItems = document.querySelectorAll('.product-item');

        productItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            const itemStore = item.getAttribute('data-store');
            const itemTitle = item.getAttribute('data-title') || '';

            const matchesCategoryOrStore = (
                activeFilter === 'todos' ||
                itemCategory === activeFilter ||
                itemStore === activeFilter
            );
            const matchesSearch = itemTitle.includes(searchText);

            if (matchesCategoryOrStore && matchesSearch) {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (selectedFilterText) {
                selectedFilterText.textContent = `Filtro Ativo: ${btn.textContent.trim()}`;
            }
            applyFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // 3. FORMULÁRIO DE CONTATO (index.html)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const subjectInput = document.getElementById('subject');
            const messageInput = document.getElementById('message');
            const formAlert = document.getElementById('formAlert');
            const alertMessage = document.getElementById('alertMessage');

            let isValid = true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (nameInput.value.trim() === '') { nameInput.classList.add('is-invalid'); isValid = false; }
            else { nameInput.classList.remove('is-invalid'); nameInput.classList.add('is-valid'); }

            if (!emailRegex.test(emailInput.value.trim())) { emailInput.classList.add('is-invalid'); isValid = false; }
            else { emailInput.classList.remove('is-invalid'); emailInput.classList.add('is-valid'); }

            if (!subjectInput.value) { subjectInput.classList.add('is-invalid'); isValid = false; }
            else { subjectInput.classList.remove('is-invalid'); subjectInput.classList.add('is-valid'); }

            if (messageInput.value.trim().length < 10) { messageInput.classList.add('is-invalid'); isValid = false; }
            else { messageInput.classList.remove('is-invalid'); messageInput.classList.add('is-valid'); }

            if (isValid) {
                formAlert.className = 'alert alert-success alert-dismissible fade show';
                alertMessage.textContent = 'Mensagem enviada com sucesso! A Vânia entrará em contato em breve.';
                formAlert.style.display = 'block';
                contactForm.reset();
                document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
            } else {
                formAlert.className = 'alert alert-danger alert-dismissible fade show';
                alertMessage.textContent = 'Por favor, preencha todos os campos corretamente antes de enviar.';
                formAlert.style.display = 'block';
            }
        });
    }

    // 4. LOGIN E FORMULÁRIO DO PAINEL ADMIN (admin.html)
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        if (sessionStorage.getItem('vania_admin_auth') === 'true') {
            document.getElementById('loginSection').classList.add('d-none');
            document.getElementById('adminDashboard').classList.remove('d-none');
            document.getElementById('logoutBtn').classList.remove('d-none');
            updateTokenStatus();
        }

        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pass = document.getElementById('adminPassword').value;
            if (pass === '1234') {
                sessionStorage.setItem('vania_admin_auth', 'true');
                document.getElementById('loginSection').classList.add('d-none');
                document.getElementById('adminDashboard').classList.remove('d-none');
                document.getElementById('logoutBtn').classList.remove('d-none');
                updateTokenStatus();
            } else {
                alert('Senha incorreta!');
            }
        });
    }

    const adminProductForm = document.getElementById('adminProductForm');
    if (adminProductForm) {
        adminProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const editId = document.getElementById('editProductId').value;
            const productObj = {
                id: editId ? Number(editId) : Date.now(),
                title: document.getElementById('prodTitle').value.trim(),
                category: document.getElementById('prodCategory').value,
                store: document.getElementById('prodStore').value,
                price: document.getElementById('prodPrice').value.trim(),
                rating: document.getElementById('prodRating').value.trim() || '5.0',
                description: document.getElementById('prodDesc').value.trim(),
                img: document.getElementById('prodImg').value.trim(),
                url: document.getElementById('prodUrl').value.trim()
            };

            let updatedList;
            if (editId) {
                updatedList = productsList.map(p => p.id === Number(editId) ? productObj : p);
            } else {
                updatedList = [productObj, ...productsList];
            }

            const success = await syncWithGithub(updatedList);
            if (success) {
                resetAdminForm();
            }
        });
    }
});

function closeAlert() {
    const formAlert = document.getElementById('formAlert');
    if (formAlert) formAlert.style.display = 'none';
}
