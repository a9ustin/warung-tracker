// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const transactionsTable = document.getElementById('transactions-table').getElementsByTagName('tbody')[0];
const currentDateDisplay = document.getElementById('current-date');
const totalIncomeDisplay = document.getElementById('total-income');
const totalExpenseDisplay = document.getElementById('total-expense');
const balanceDisplay = document.getElementById('balance');
const dailyRecapBtn = document.getElementById('daily-recap-btn');
const monthlyRecapBtn = document.getElementById('monthly-recap-btn');
const printRecapBtn = document.getElementById('print-recap-btn');
const recapContent = document.getElementById('recap-content');

// Initialize date fields
const today = new Date();
const dateInput = document.getElementById('date');
dateInput.valueAsDate = today;
currentDateDisplay.textContent = formatDate(today);

// Initialize data storage
function initializeStorage() {
  try {
    if (!localStorage.getItem('todayTransactions')) {
      localStorage.setItem('todayTransactions', JSON.stringify([]));
    }
    if (!localStorage.getItem('transactionArchive')) {
      localStorage.setItem('transactionArchive', JSON.stringify([]));
    }
    if (!localStorage.getItem('lastSavedDate')) {
      localStorage.setItem('lastSavedDate', today.toDateString());
    }
  } catch (error) {
    console.error("Storage initialization failed:", error);
  }
}

initializeStorage();
checkNewDay();
loadTransactions();

// Event listeners
transactionForm.addEventListener('submit', addTransaction);
dailyRecapBtn.addEventListener('click', showDailyRecap);
monthlyRecapBtn.addEventListener('click', showMonthlyRecap);
printRecapBtn.addEventListener('click', printRecap);

// Helper functions
function formatDate(date) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

function formatCurrency(amount) {
  return 'Rp' + amount.toLocaleString('id-ID');
}

function checkNewDay() {
  const lastSavedDate = localStorage.getItem('lastSavedDate');
  const todayStr = today.toDateString();
  
  if (lastSavedDate && lastSavedDate !== todayStr) {
    archiveTransactions();
    localStorage.removeItem('todayTransactions');
  }
  
  localStorage.setItem('lastSavedDate', todayStr);
}

function archiveTransactions() {
  const todayTransactions = JSON.parse(localStorage.getItem('todayTransactions') || []);
  if (todayTransactions.length === 0) return;
  
  const archive = JSON.parse(localStorage.getItem('transactionArchive') || []);
  const todayStr = formatDate(today);
  
  archive.push({
    date: todayStr,
    transactions: todayTransactions,
    totalIncome: calculateTotal(todayTransactions, 'income'),
    totalExpense: calculateTotal(todayTransactions, 'expense'),
    balance: calculateBalance(todayTransactions)
  });
  
  localStorage.setItem('transactionArchive', JSON.stringify(archive));
}

// Core functions
function addTransaction(e) {
  e.preventDefault();
  
  try {
    const transaction = {
      id: Date.now(),
      type: document.getElementById('type').value,
      amount: parseFloat(document.getElementById('amount').value),
      description: document.getElementById('description').value,
      date: document.getElementById('date').value
    };

    const transactions = JSON.parse(localStorage.getItem('todayTransactions') || []);
    transactions.push(transaction);
    localStorage.setItem('todayTransactions', JSON.stringify(transactions));
    
    loadTransactions();
    transactionForm.reset();
    dateInput.valueAsDate = new Date();
  } catch (error) {
    console.error("Failed to save transaction:", error);
    alert("Gagal menyimpan transaksi. Coba lagi.");
  }
}

function loadTransactions() {
  let transactions = [];
  try {
    const storedData = localStorage.getItem('todayTransactions');
    transactions = storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error("Error parsing transactions:", error);
    transactions = [];
    localStorage.setItem('todayTransactions', JSON.stringify([]));
  }

  transactionsTable.innerHTML = '';

  transactions.forEach((transaction, index) => {
    const row = transactionsTable.insertRow();
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${transaction.type === 'income' ? 'Uang Masuk' : 'Uang Keluar'}</td>
      <td>${formatCurrency(transaction.amount)}</td>
      <td>${transaction.description}</td>
      <td><button onclick="deleteTransaction(${transaction.id})">Hapus</button></td>
    `;
  });

  updateSummary(transactions);
}

function updateSummary(transactions) {
  const totalIncome = calculateTotal(transactions, 'income');
  const totalExpense = calculateTotal(transactions, 'expense');
  const balance = calculateBalance(transactions);
  
  totalIncomeDisplay.textContent = formatCurrency(totalIncome);
  totalExpenseDisplay.textContent = formatCurrency(totalExpense);
  balanceDisplay.textContent = formatCurrency(balance);
}

function calculateTotal(transactions, type) {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

function calculateBalance(transactions) {
  const income = calculateTotal(transactions, 'income');
  const expense = calculateTotal(transactions, 'expense');
  return income - expense;
}

function deleteTransaction(id) {
  let transactions = JSON.parse(localStorage.getItem('todayTransactions')) || [];
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem('todayTransactions', JSON.stringify(transactions));
  loadTransactions();
}

// Recap functions
function showDailyRecap() {
  const transactions = JSON.parse(localStorage.getItem('todayTransactions') || []);
  const totalIncome = calculateTotal(transactions, 'income');
  const totalExpense = calculateTotal(transactions, 'expense');
  const balance = calculateBalance(transactions);
  
  let html = `
    <h3>Rekapitulasi Harian - ${formatDate(today)}</h3>
    <div class="recap-summary">
      <p><strong>Total Uang Masuk:</strong> ${formatCurrency(totalIncome)}</p>
      <p><strong>Total Uang Keluar:</strong> ${formatCurrency(totalExpense)}</p>
      <p><strong>Saldo:</strong> ${formatCurrency(balance)}</p>
    </div>
    <h4>Detail Transaksi:</h4>
    <ul class="recap-transactions">
  `;
  
  if (transactions.length === 0) {
    html += `<li>Tidak ada transaksi hari ini</li>`;
  } else {
    transactions.forEach(t => {
      html += `
        <li>
          [${t.type === 'income' ? 'Uang Masuk' : 'Uang Keluar'}] 
          ${formatCurrency(t.amount)} - 
          ${t.description}
        </li>
      `;
    });
  }
  
  html += `</ul>`;
  recapContent.innerHTML = html;
}

function showMonthlyRecap() {
  const archive = JSON.parse(localStorage.getItem('transactionArchive') || []);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const monthlyData = archive.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });
  
  const monthlyIncome = monthlyData.reduce((sum, day) => sum + day.totalIncome, 0);
  const monthlyExpense = monthlyData.reduce((sum, day) => sum + day.totalExpense, 0);
  const monthlyBalance = monthlyIncome - monthlyExpense;
  
  let html = `
    <h3>Rekapitulasi Bulanan - ${today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
    <div class="recap-summary">
      <p><strong>Total Uang Masuk Bulanan:</strong> ${formatCurrency(monthlyIncome)}</p>
      <p><strong>Total Uang Keluar Bulanan:</strong> ${formatCurrency(monthlyExpense)}</p>
      <p><strong>Saldo Bulanan:</strong> ${formatCurrency(monthlyBalance)}</p>
    </div>
    <h4>Rekap Harian:</h4>
  `;
  
  if (monthlyData.length === 0) {
    html += `<p>Tidak ada data transaksi untuk bulan ini</p>`;
  } else {
    monthlyData.forEach(day => {
      html += `
        <div class="daily-recap">
          <h5>${day.date}</h5>
          <p>Uang Masuk: ${formatCurrency(day.totalIncome)}</p>
          <p>Uang Keluar: ${formatCurrency(day.totalExpense)}</p>
          <p>Saldo: ${formatCurrency(day.balance)}</p>
        </div>
      `;
    });
  }
  
  recapContent.innerHTML = html;
}

function printRecap() {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Rekap Warung Makan</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2c3e50; }
          .recap-summary { margin-bottom: 20px; }
          .recap-summary p { margin: 5px 0; }
          .recap-transactions { margin-top: 10px; }
          .daily-recap { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        ${recapContent.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 200);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Make deleteTransaction available globally
window.deleteTransaction = deleteTransaction;