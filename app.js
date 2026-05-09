document.addEventListener('DOMContentLoaded', () => {
    /*================================================================
      1. SUPABASE INITIALIZATION (Placeholder)
    ================================================================*/
    // Substitua as strings abaixo pelas credenciais fornecidas
    // const SUPABASE_URL = 'SUPABASE_URL_AQUI';
    //const SUPABASE_KEY = 'SUPABASE_KEY_AQUI';

    const SUPABASE_URL = 'https://kcyxgolqpxyxalxoxvwp.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_-CzTEElN0_DkiximLE2dwA_jmpmZMgj';

    let supabase = null;
    if (typeof window.supabase !== 'undefined') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } catch(e) {
            console.error("Erro ao iniciar Supabase:", e);
        }
    }

    /*================================================================
      2. UI & SCROLL BEHAVIORS
    ================================================================*/
    // Mobile Menu Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('is-active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('is-active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        }
    });

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Number Counter Animation
                if (entry.target.classList.contains('stats-container')) {
                    startCounters();
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.slide-in-left, .slide-in-right, .stats-container').forEach(el => {
        observer.observe(el);
    });

    // Number Counter function
    let countersStarted = false;
    function startCounters() {
        if (countersStarted) return;
        countersStarted = true;
        const counters = document.querySelectorAll('.counter');
        const speed = 200;

        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const inc = target / speed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 10);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    }

    /*================================================================
      3. INPUT MASKS
    ================================================================*/
    const phoneInputs = document.querySelectorAll('.phone-mask');
    const cnpjInputs = document.querySelectorAll('.cnpj-mask');

    phoneInputs.forEach(input => {
        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 2) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            }
            if (value.length > 10) {
                value = `${value.slice(0, 10)}-${value.slice(10)}`;
            }
            e.target.value = value;
        });
    });

    cnpjInputs.forEach(input => {
        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 14) value = value.slice(0, 14);
            if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            if (value.length > 6) value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            if (value.length > 10) value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            if (value.length > 15) value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
    });

    /*================================================================
      4. WIZARD LOGIC
    ================================================================*/
    const wizardModal = document.getElementById('wizard-modal');
    const btnOpenWizard = document.getElementById('btn-open-wizard');
    const btnCloseWizard = document.getElementById('close-wizard');
    const btnFinishWizard = document.getElementById('btn-finish-wizard');

    let currentStep = 1;
    const totalSteps = 4;

    // Open/Close Modal
    btnOpenWizard.addEventListener('click', () => {
        wizardModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
        wizardModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    btnCloseWizard.addEventListener('click', closeModal);
    btnFinishWizard.addEventListener('click', () => {
        closeModal();
        setTimeout(() => location.reload(), 500); // Reload to clear form
    });

    // Navigation buttons
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateWizard();
            }
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            updateWizard();
        });
    });

    // Character counter
    const wProblema = document.getElementById('w_problema');
    const charCount = document.getElementById('char-count');
    wProblema.addEventListener('input', () => {
        charCount.innerText = wProblema.value.length;
        if (wProblema.value.length >= 100) {
            charCount.style.color = 'var(--success-color)';
        } else {
            charCount.style.color = 'var(--text-muted)';
        }
    });

    function validateStep(step) {
        let isValid = true;

        if (step === 1) {
            const empresa = document.getElementById('w_empresa').value.trim();
            const contato = document.getElementById('w_nome_contato').value.trim();
            if (!empresa || !contato) {
                alert("Por favor, preencha os campos obrigatórios (Nome da Empresa e Nome do Contato).");
                isValid = false;
            }
        }

        if (step === 2) {
            const problema = document.getElementById('w_problema').value.trim();
            if (problema.length < 100) {
                alert("Por favor, descreva o problema com pelo menos 100 caracteres.");
                isValid = false;
            }
        }

        return isValid;
    }

    function updateWizard() {
        // Update Progress Bar
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        document.getElementById('progress-bar').style.setProperty('--progress', `${progressPercentage}%`);

        // Update Steps display
        document.querySelectorAll('.step-content').forEach((stepEl, index) => {
            if (index + 1 === currentStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });

        // Update Circles
        document.querySelectorAll('.circle').forEach((circle, index) => {
            const stepNum = index + 1;
            circle.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                circle.classList.add('active');
            } else if (stepNum < currentStep) {
                circle.classList.add('completed');
                circle.innerHTML = '<i class="fa-solid fa-check"></i>';
            } else {
                circle.innerHTML = stepNum;
            }
        });

        // Generate Summary before Step 4
        if (currentStep === 4) {
            generateSummary();
        }
    }

    function generateSummary() {
        const summaryContent = document.getElementById('summary-content');

        // Collect data
        const empresa = document.getElementById('w_empresa').value || '-';
        const contato = document.getElementById('w_nome_contato').value || '-';
        const segmento = document.getElementById('w_segmento').value || '-';
        const dashboard = document.getElementById('w_dashboard').checked ? 'Sim' : 'Não';

        const tiposNodes = document.querySelectorAll('input[name="w_tipo_solucao"]:checked');
        const tiposArr = Array.from(tiposNodes).map(n => n.value);
        const tiposStr = tiposArr.length > 0 ? tiposArr.join(', ') : 'Nenhum selecionado';

        summaryContent.innerHTML = `
            <div class="summary-item"><strong>Empresa:</strong> ${empresa}</div>
            <div class="summary-item"><strong>Contato:</strong> ${contato}</div>
            <div class="summary-item"><strong>Segmento:</strong> ${segmento}</div>
            <div class="summary-item"><strong>Dashboard/Relatórios:</strong> ${dashboard}</div>
            <div class="summary-item"><strong>Tipos de Solução:</strong> ${tiposStr}</div>
        `;
    }

    /*================================================================
      5. FORM SUBMISSIONS
    ================================================================*/

    // Contato Form Mock
    document.getElementById('contact-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.classList.add('btn-loading');

        setTimeout(() => {
            btn.classList.remove('btn-loading');
            document.getElementById('contact-msg').innerHTML = '<span class="text-success" style="color: var(--success-color);">Mensagem enviada com sucesso!</span>';
            e.target.reset();
            setTimeout(() => {
                document.getElementById('contact-msg').innerHTML = '';
            }, 3000);
        }, 1500);
    });

    // Wizard Submission
    document.getElementById('wizard-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Final validation
        if (!document.getElementById('w_confirmo').checked) {
            const err = document.getElementById('wizard-error');
            err.style.display = 'block';
            err.innerText = "Você precisa confirmar as informações.";
            return;
        }
        document.getElementById('wizard-error').style.display = 'none';

        const btnSubmit = document.getElementById('btn-submit-wizard');
        btnSubmit.classList.add('btn-loading');

        // Collect all data
        const data = {
            empresa: document.getElementById('w_empresa').value,
            cnpj: document.getElementById('w_cnpj').value,
            contato: document.getElementById('w_nome_contato').value,
            celular: document.getElementById('w_celular').value,
            segmento: document.getElementById('w_segmento').value,
            problema: document.getElementById('w_problema').value,
            funcionalidades: document.getElementById('w_funcionalidades').value,
            regras: document.getElementById('w_regras').value,
            tipo_solucao: Array.from(document.querySelectorAll('input[name="w_tipo_solucao"]:checked')).map(el => el.value)
        };

        // Generate Protocol (ANO+MES+ID_Aleatorio)
        const date = new Date();
        const ano = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const protocolo = `${ano}${mes}-${randomId}`;

        data.protocolo = protocolo;

        try {
            // Check if supabase is initialized
            if (SUPABASE_URL === 'SUPABASE_URL_AQUI' || !supabase) {
                // Mock success for demonstration if no credentials
                console.warn('Supabase não configurado. Simulando envio bem-sucedido...');
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                // Real Supabase Insert
                const { error } = await supabase
                    .from('orcamentos')
                    .insert([data]);

                if (error) throw error;
            }

            // Show Success State
            document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
            document.getElementById('step-success').classList.add('active');
            document.getElementById('protocol-number').innerText = protocolo;

        } catch (error) {
            console.error('Erro ao salvar proposta:', error);
            const err = document.getElementById('wizard-error');
            err.style.display = 'block';
            err.innerText = "Erro ao enviar solicitação. Tente novamente mais tarde.";
        } finally {
            btnSubmit.classList.remove('btn-loading');
        }
    });

});
