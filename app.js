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

async function addEmployee() {
  let positions = await db.query('Select id, title FROM role');
  let managers = await db.query('Select id, CONCAT(first_name, " ", last_name) AS Manager FROM employee');
  managers.unshift({id: null, Manager: "None"});

  inquirer
    .prompt([{
      name:"firstName",
      type: "input",
      message: "Enter employee's first name:"
    },
    {
      name: "lastName",
      type: "input",
      message: "Enter employee's last name:"
    },
    {
      name: "role",
      type: "list",
      message: "Choose employee role:",
      choices: positions.map(obj => obj.title)
    },
    {
      name: "manager",
      type: "list",
      message:"Choose a manager for the employee:",
      choices: managers.map(obj => obj.Manager)
    }
    ]).then((answers) => {
      let positionDetails = positions.find(obj => obj.title === answers.role);
      let manager = managers.find(obj => obj.Manager === answers.manager);
      db.query("INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?)",
      [[answers.firstName, answers.lastName, positionDetails.id,manager.id]]);
      console.log(`${answers.firstName} was added to the employee database`);
      runApp();
    });
};

  async function removeEmployee () {
    let employees = await db.query('Select id, CONCAT(first_name, " ", last_name) AS name FROM employee');
    employees.push({id: null, name: "Cancel"});

    inquirer
      .prompt([
        {
          name: "employeeName",
          type: "list",
          message: "Which employee would you like to remove?",
          choices: employees.map(obj => obj.name)
        }
      ]).then((response) => {
        if (response.employeeName != "Cancel") {
          let exEmployee = employees.find(obj => obj.name === response.employeeName);
          db.query("DELETE FROM employee WHERE id=?", exEmployee.id);
          console.log(`${response.employeeName} is no longer an employee`);
        }
        runApp();
      })
  };

function runApp() {
  inquirer
    .prompt({
      name: "employeetracker",
      type: "list",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "Add a New Employee",
        "Remove an Employee",
        "Update Employee Info",
        "Add a New Role",
        "Add a New Department"
      ]
    }).then((responses) => {
      switch (responses.employeetracker) {
        case "View All Employees":
          employeeSummary();
          break;
        case "Add a New Employee":
          addEmployee();
          break;
        case "Remove an Employee":
          removeEmployee();
          break;
        case "Update Employee Info":
          break;
        case "Add a New Role":
          break;
        case "Add a New Department":
          break;
      }
    });
}

runApp();