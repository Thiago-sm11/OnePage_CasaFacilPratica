/* ========================================================
   SISTEMA DE MODO ADMINISTRADOR (LOGIN VANIA)
======================================================== */
let isAdminLoggedIn = false;

function toggleAdminMode() {
    const addProductBtn = document.getElementById('addProductAdminBtn');
    const adminBtnText = document.getElementById('adminBtnText');
    const adminLoginBtn = document.getElementById('adminLoginBtn');

    if (isAdminLoggedIn) {
        // Logout
        isAdminLoggedIn = false;
        if (addProductBtn) addProductBtn.classList.add('d-none');
        if (adminBtnText) adminBtnText.textContent = 'Admin';
        if (adminLoginBtn) adminLoginBtn.className = 'btn btn-sm btn-outline-secondary rounded-pill';
        alert('Você saiu do modo Administrador.');
    } else {
        // Solicitar Senha simples (Padrão: 1234)
        const password = prompt('Área Restrita da Vânia\nDigite a senha de Administradora para liberar o cadastro de links:');
        if (password === '1234') {
            isAdminLoggedIn = true;
            if (addProductBtn) addProductBtn.classList.remove('d-none');
            if (adminBtnText) adminBtnText.textContent = 'Sair (Admin)';
            if (adminLoginBtn) adminLoginBtn.className = 'btn btn-sm btn-success rounded-pill';
            alert('Login efetuado com sucesso! O botão "➕ Cadastrar Novo Achadinho" já está visível na tela inicial.');
        } else if (password !== null) {
            alert('Senha incorreta! Acesso negado.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    /* ========================================================
       1. TOGGLE SWITCH - MODO ESCURO / CLARO
    ======================================================== */
    const checkboxToggle = document.getElementById('checkboxToggle');
    const htmlElement = document.documentElement;

    // Checar modo salvo previamente
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


    /* ========================================================
       2. EFEITO JS: FILTRO DE CATEGORIA/LOJA E BUSCA EM TEMPO REAL
    ======================================================== */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const selectedFilterText = document.getElementById('selectedFilterText');

    // Função global de filtragem
    function applyFilters() {
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'todos';
        const searchText = searchInput ? searchInput.value.toLowerCase() : '';
        const productItems = document.querySelectorAll('.product-item');

        productItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            const itemStore = item.getAttribute('data-store');
            const itemTitle = item.getAttribute('data-title') ? item.getAttribute('data-title').toLowerCase() : '';

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

    // Escutadores de eventos para botões de filtro
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterName = btn.textContent.trim();
            if (selectedFilterText) {
                selectedFilterText.textContent = `Filtro Ativo: ${filterName}`;
            }

            applyFilters();
        });
    });

    // Escutador de eventos para campo de busca
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }


    /* ========================================================
       3. CADASTRO DINÂMICO DE NOVOS ACHADINHOS (MODAL VÂNIA)
    ======================================================== */
    const newProductForm = document.getElementById('newProductForm');

    if (newProductForm) {
        newProductForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('newTitle').value;
            const category = document.getElementById('newCategory').value;
            const store = document.getElementById('newStore').value;
            const price = document.getElementById('newPrice').value;
            const img = document.getElementById('newImg').value;
            const affiliateUrl = document.getElementById('newAffiliateUrl').value;

            // Configurar visual da loja
            let storeBadgeHtml = '';
            let storeBtnText = '';

            switch (store) {
                case 'shopee':
                    storeBadgeHtml = '<span class="badge-store badge-shopee"><i class="fa-solid fa-bag-shopping"></i> Shopee</span>';
                    storeBtnText = 'Ver Oferta na Shopee';
                    break;
                case 'shein':
                    storeBadgeHtml = '<span class="badge-store badge-shein"><i class="fa-solid fa-shirt"></i> SHEIN</span>';
                    storeBtnText = 'Ver Oferta na SHEIN';
                    break;
                case 'mercadolivre':
                    storeBadgeHtml = '<span class="badge-store badge-mercadolivre"><i class="fa-solid fa-handshake"></i> Mercado Livre</span>';
                    storeBtnText = 'Ver no Mercado Livre';
                    break;
                case 'amazon':
                    storeBadgeHtml = '<span class="badge-store badge-amazon"><i class="fa-brands fa-amazon"></i> Amazon</span>';
                    storeBtnText = 'Ver Oferta na Amazon';
                    break;
                case 'temu':
                    storeBadgeHtml = '<span class="badge-store badge-temu"><i class="fa-solid fa-gift"></i> Temu</span>';
                    storeBtnText = 'Ver Oferta na Temu';
                    break;
            }

            const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1);

            // Criar o novo card dinamicamente
            const newCardCol = document.createElement('div');
            newCardCol.className = 'col-sm-6 col-lg-4 product-item';
            newCardCol.setAttribute('data-category', category);
            newCardCol.setAttribute('data-store', store);
            newCardCol.setAttribute('data-title', `${title} ${category} ${store}`.toLowerCase());

            newCardCol.innerHTML = `
                <div class="product-card">
                    <div class="product-img-wrapper">
                        <span class="badge-category">${categoryCapitalized}</span>
                        ${storeBadgeHtml}
                        <img src="${img}" alt="${title}" onerror="this.src='https://placehold.co/600x400/2cb5c4/ffffff?text=Achadinho'">
                    </div>
                    <div class="card-body p-4 text-center">
                        <div class="text-warning mb-2"><i class="fa-solid fa-star"></i> 5.0 (Novo)</div>
                        <h5 class="card-title fw-bold">${title}</h5>
                        <p class="card-text text-muted small">Novo achadinho recomendado pela Vânia!</p>
                        <div class="fs-4 fw-bold text-success mb-3">R$ ${price}</div>
                        <a href="${affiliateUrl}" target="_blank" class="btn btn-custom-turquoise w-100">
                            <i class="fa-solid fa-arrow-up-right-from-square me-2"></i> ${storeBtnText}
                        </a>
                    </div>
                </div>
            `;

            // Inserir no início da grade de produtos
            const productsGrid = document.getElementById('productsGrid');
            if (productsGrid) {
                productsGrid.insertBefore(newCardCol, productsGrid.firstChild);
            }

            // Fechar o modal e resetar o formulário
            const modalElement = document.getElementById('addLinkModal');
            const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
            newProductForm.reset();

            // Re-aplicar filtros
            applyFilters();
        });
    }


    /* ========================================================
       4. VALIDAÇÃO DINÂMICA DO FORMULÁRIO DE CONTATO
    ======================================================== */
    const contactForm = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    const formAlert = document.getElementById('formAlert');
    const alertMessage = document.getElementById('alertMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            let isValid = true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // Validação do Nome
            if (nameInput.value.trim() === '') {
                nameInput.classList.add('is-invalid');
                isValid = false;
            } else {
                nameInput.classList.remove('is-invalid');
                nameInput.classList.add('is-valid');
            }

            // Validação do E-mail
            if (!emailRegex.test(emailInput.value.trim())) {
                emailInput.classList.add('is-invalid');
                isValid = false;
            } else {
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
            }

            // Validação do Assunto
            if (!subjectInput.value) {
                subjectInput.classList.add('is-invalid');
                isValid = false;
            } else {
                subjectInput.classList.remove('is-invalid');
                subjectInput.classList.add('is-valid');
            }

            // Validação da Mensagem
            if (messageInput.value.trim().length < 10) {
                messageInput.classList.add('is-invalid');
                isValid = false;
            } else {
                messageInput.classList.remove('is-invalid');
                messageInput.classList.add('is-valid');
            }

            if (isValid) {
                showAlert('Mensagem enviada com sucesso! A Vânia entrará em contato em breve.', 'success');
                contactForm.reset();
                document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
            } else {
                showAlert('Por favor, preencha todos os campos corretamente antes de enviar.', 'danger');
            }
        });
    }

    function showAlert(msg, type) {
        if (formAlert && alertMessage) {
            formAlert.className = `alert alert-${type} alert-dismissible fade show`;
            alertMessage.textContent = msg;
            formAlert.style.display = 'block';
        }
    }
});

function closeAlert() {
    const formAlert = document.getElementById('formAlert');
    if (formAlert) {
        formAlert.style.display = 'none';
    }
}
