const Storage = {
    getActiveUser() {
        return localStorage.getItem("dev.finances:activeUser");
    },

    setActiveUser(user) {
        localStorage.setItem("dev.finances:activeUser", user);
    },

    get() {
        const user = Storage.getActiveUser();
        if (!user) return [];
        return JSON.parse(localStorage.getItem(`dev.finances:${user}:transactions`)) || [];
    },

    set(transactions) {
        const user = Storage.getActiveUser();
        if (!user) return;
        localStorage.setItem(`dev.finances:${user}:transactions`, JSON.stringify(transactions));
    }
}

const Transaction = {
    all: Storage.get(),

    filtered() {
        const dateFilter = document.getElementById('dateFilter').value;
        const selectedMonth = document.getElementById('monthSelect').value;

        // Se tiver uma data específica selecionada, filtra por ela
        if (dateFilter) {
            const [year, month, day] = dateFilter.split('-');
            const formattedDate = `${day}/${month}/${year}`;
            return Transaction.all.filter(transaction => transaction.date === formattedDate);
        }

        if (!selectedMonth || selectedMonth === 'all') {
            return Transaction.all;
        }
        
        return Transaction.all.filter(transaction => {
            return Utils.formatDateToMonthKey(transaction.date) === selectedMonth;
        });
    },

    add(transaction) {
        // Gera um ID simples baseado no tempo atual para poder excluir depois
        transaction.id = Date.now();
        Transaction.all.push(transaction);
        Storage.set(Transaction.all);
        App.reload();
    },

    incomes() {
        let income = 0;
        Transaction.filtered().forEach(transaction => {
            if(transaction.amount > 0) income += transaction.amount;
        });
        return income;
    },

    expenses() {
        let expense = 0;
        Transaction.filtered().forEach(transaction => {
            if(transaction.amount < 0) expense += transaction.amount;
        });
        return expense;
    },

    total() {
        return Transaction.incomes() + Transaction.expenses();
    },

    remove(id) {
        Transaction.all = Transaction.all.filter(transaction => transaction.id !== id);
        Storage.set(Transaction.all);
        App.reload();
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr');
        tr.innerHTML = DOM.innerHTMLTransaction(transaction);
        DOM.transactionsContainer.appendChild(tr);
    },

    innerHTMLTransaction(transaction) {
        const CSSclass = transaction.amount > 0 ? "income" : "expense";
        const amount = Utils.formatCurrency(transaction.amount);
        const time = transaction.time ? ` - ${transaction.time}` : '';

        const html = `
            <td class="description" data-label="Descrição">${transaction.description}</td>
            <td class="${CSSclass}" data-label="Valor">${amount}</td>
            <td class="date" data-label="Data">${transaction.date}${time}</td>
            <td>
                <img onclick="Transaction.remove(${transaction.id})" src="https://img.icons8.com/material-outlined/24/e92929/trash--v1.png" alt="Remover transação">
            </td>
        `;
        return html;
    },

    updateBalance() {
        document.getElementById('incomeDisplay').innerHTML = Utils.formatCurrency(Transaction.incomes());
        document.getElementById('expenseDisplay').innerHTML = Utils.formatCurrency(Transaction.expenses());
        document.getElementById('totalDisplay').innerHTML = Utils.formatCurrency(Transaction.total());
    },

    populateMonthSelect() {
        const select = document.getElementById('monthSelect');
        const currentSelection = select.value;

        // Pegar meses únicos das transações
        const months = new Set();
        Transaction.all.forEach(t => {
            months.add(Utils.formatDateToMonthKey(t.date));
        });
        
        // Converter para array e ordenar (mais recente primeiro)
        const sortedMonths = Array.from(months).sort().reverse();

        select.innerHTML = '<option value="all">Todos os meses</option>';

        sortedMonths.forEach(monthKey => {
            const option = document.createElement('option');
            option.value = monthKey;
            option.innerHTML = Utils.formatMonthKeyToView(monthKey);
            select.appendChild(option);
        });

        // Manter a seleção atual se ela ainda existir
        if (months.has(currentSelection)) {
            select.value = currentSelection;
        }
    }
}

const Utils = {
    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : "";
        value = String(value).replace(/\D/g, "");
        value = Number(value) / 100;
        value = value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        return signal + value;
    },

    formatAmount(value) {
        value = Number(value) * 100;
        return Math.round(value);
    },

    formatDate(date) {
        const splittedDate = date.split("-");
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`;
    },

    formatDateToMonthKey(date) {
        // Recebe DD/MM/YYYY e retorna YYYY-MM para ordenação
        const [day, month, year] = date.split('/');
        return `${year}-${month}`;
    },

    formatMonthKeyToView(monthKey) {
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }
}

const App = {
    init() {
        Transaction.all = Storage.get();
        DOM.populateMonthSelect();
        Transaction.filtered().forEach(DOM.addTransaction);
        DOM.updateBalance();
    },
    reload() {
        DOM.transactionsContainer.innerHTML = "";
        App.init();
    }
}

// Controle de Login
const Login = {
    init() {
        const activeUser = Storage.getActiveUser();
        if (activeUser) {
            Login.showApp();
        } else {
            Login.showLogin();
        }
    },

    submit(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim();
        if (username) {
            Storage.setActiveUser(username);
            Login.showApp();
        }
    },

    logout() {
        localStorage.removeItem("dev.finances:activeUser");
        location.reload();
    },

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        App.init();
    }
}

// Inicia verificando o login em vez de iniciar o App direto
Login.init();

const Modal = {
    open() {
        // Abrir modal
        // Adicionar a class active ao modal
        document.querySelector('.modal-overlay').classList.add('active');
    },
    close() {
        // Fechar modal
        // Remover a class active do modal
        document.querySelector('.modal-overlay').classList.remove('active');
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),
    time: document.querySelector('input#time'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value,
            time: Form.time.value
        }
    },

    validateFields() {
        const { description, amount, date, time } = Form.getValues();
        
        if( description.trim() === "" || amount.trim() === "" || date.trim() === "" || time.trim() === "" ) {
            throw new Error("Por favor, preencha todos os campos");
        }
    },

    formatValues() {
        let { description, amount, date, time } = Form.getValues();
        
        amount = Utils.formatAmount(amount);
        date = Utils.formatDate(date);

        return {
            description,
            amount,
            date,
            time
        }
    },

    submit(event) {
        event.preventDefault();

        try {
            Form.validateFields();
            const transaction = Form.formatValues();
            Transaction.add(transaction);
            Form.description.value = ""; Form.amount.value = ""; Form.date.value = ""; Form.time.value = ""; // Limpar campos
            Modal.close();
        } catch (error) {
            alert(error.message);
        }
    }
}