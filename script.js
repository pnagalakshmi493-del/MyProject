let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editId = null;

const form = document.getElementById("transactionForm");
const type = document.getElementById("type");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const date = document.getElementById("date");
const description = document.getElementById("description");
const transactionList = document.getElementById("transactionList");
const search = document.getElementById("search");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");

date.value = new Date().toISOString().split("T")[0];

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const transaction = {
        id: editId || Date.now(),
        type: type.value,
        amount: Number(amount.value),
        category: category.value,
        date: date.value,
        description: description.value
    };

    if (editId) {
        transactions = transactions.map(t => t.id === editId ? transaction : t);
        editId = null;
    } else {
        transactions.push(transaction);
    }

    saveData();
    form.reset();
    date.value = new Date().toISOString().split("T")[0];
    document.querySelector(".add-btn").textContent = "Add Transaction";
    displayTransactions();
});

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function displayTransactions() {
    transactionList.innerHTML = "";

    let filtered = transactions.filter(t => {
        const searchText = search.value.toLowerCase();

        const matchesSearch =
            t.description.toLowerCase().includes(searchText) ||
            t.category.toLowerCase().includes(searchText);

        const matchesType =
            filterType.value === "all" ||
            t.type === filterType.value;

        const matchesCategory =
            filterCategory.value === "all" ||
            t.category === filterCategory.value;

        return matchesSearch && matchesType && matchesCategory;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(t => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.type}</td>
            <td>${t.category}</td>
            <td>${t.description}</td>
            <td class="${t.type === "income" ? "income-text" : "expense-text"}">
                ${t.type === "income" ? "+" : "-"}₹${t.amount.toFixed(2)}
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editTransaction(${t.id})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>
            </td>
        `;

        transactionList.appendChild(row);
    });

    document.getElementById("noTransactions").style.display =
        filtered.length === 0 ? "block" : "none";

    updateDashboard();
    updateChart();
}

function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        if (t.type === "income") {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });

    const balance = totalIncome - totalExpense;

    document.getElementById("income").textContent =
        "₹" + totalIncome.toFixed(2);

    document.getElementById("expense").textContent =
        "₹" + totalExpense.toFixed(2);

    document.getElementById("balance").textContent =
        "₹" + balance.toFixed(2);

    document.getElementById("transactionCount").textContent =
        transactions.length;
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    displayTransactions();
}

function editTransaction(id) {
    const t = transactions.find(t => t.id === id);

    type.value = t.type;
    amount.value = t.amount;
    category.value = t.category;
    date.value = t.date;
    description.value = t.description;

    editId = id;

    document.querySelector(".add-btn").textContent = "Update Transaction";

    window.scrollTo({
        top: 250,
        behavior: "smooth"
    });
}

function updateChart() {
    const chart = document.getElementById("chart");

    const expenses = {};

    transactions.forEach(t => {
        if (t.type === "expense") {
            if (!expenses[t.category]) {
                expenses[t.category] = 0;
            }

            expenses[t.category] += t.amount;
        }
    });

    chart.innerHTML = "";

    const values = Object.values(expenses);
    const max = values.length > 0 ? Math.max(...values) : 1;

    Object.keys(expenses).forEach(category => {
        const percentage = (expenses[category] / max) * 100;

        const row = document.createElement("div");
        row.className = "chart-row";

        row.innerHTML = `
            <span>${category}</span>
            <div class="chart-bar-container">
                <div class="chart-bar" style="width:${percentage}%"></div>
            </div>
            <span>₹${expenses[category].toFixed(0)}</span>
        `;

        chart.appendChild(row);
    });

    if (Object.keys(expenses).length === 0) {
        chart.innerHTML = "<p>No expense data available.</p>";
    }
}

search.addEventListener("input", displayTransactions);
filterType.addEventListener("change", displayTransactions);
filterCategory.addEventListener("change", displayTransactions);

document.getElementById("themeBtn").addEventListener("click", function() {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        this.textContent = "☀️ Light Mode";
    } else {
        this.textContent = "🌙 Dark Mode";
    }
});

document.getElementById("exportBtn").addEventListener("click", function() {
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    let csv = "Date,Type,Category,Description,Amount\n";

    transactions.forEach(t => {
        csv += `${t.date},${t.type},${t.category},"${t.description}",${t.amount}\n`;
    });

    const blob = new Blob([csv], {
        type: "text/csv"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "expense_tracker.csv";
    a.click();

    URL.revokeObjectURL(url);
});

displayTransactions();