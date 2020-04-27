const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");

class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }

  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err)
          return reject(err);
        resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err)
          return reject(err);
        resolve();
      });
    });
  }
}

const db = new Database({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Cal_mel@1013",
  database: "companyDB"
});

async function employeeSummary() {
  await db.query('SELECT e.id, e.first_name AS First_Name, e.last_name AS Last_Name, title AS Title, salary AS Salary, name AS Department, CONCAT(m.first_name, " ", m.last_name) AS Manager FROM employee e LEFT JOIN employee m ON e.manager_id = m.id INNER JOIN role r ON e.role_id = r.id INNER JOIN department d ON r.department_id = d.id', (err, res) => {
    if (err) throw err;
    console.table(res);
    runApp();
  });
}

function runApp() {
  inquirer
    .prompt({
      name: "employeetrack",
      type: "list",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "Add a New Employee",
        "Update Employee Info",
        "Remove an Employee",
        "Add a New Role",
        "Add a New Department"
      ]
    }).then((responses) => {
      switch (responses.employeetrack) {
        case "View All Employees":
          employeeSummary();
          break;
        case "Add a New Employee":
          break;
        case "Update Employee Info":
          break;
        case "Remove an Employee":
          break;
        case "Add a New Role":
          break;
        case "Add a New Department":
          break;
      }
    });
}

runApp();