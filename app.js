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
  console.log(' ');
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
    .prompt([
    {
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
      db.query("INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?)", [[answers.firstName, answers.lastName, positionDetails.id,manager.id]]);
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
          console.log("\x1b[35m", `${response.employeeName} is no longer an employee`);
        }
        runApp();
      })
  };

  async function updateManager() {
        let employees = await db.query('Select id, CONCAT(first_name, " ", last_name) AS name FROM employee');
        employees.push({id: null, name: "Cancel"});
  
    inquirer
      .prompt([
        {
          name: "findEmployee",
          type: "list",
          message: "Select employee to update manager",
          choices: employees.map(obj => obj.name)
        }
    ]).then(employeeInfo => {
      if (employeeInfo.findEmployee == "Cancel") {
        runApp();
        return;
      }
      let managers = employees.filter(currEmployee => currEmployee.name != employeeInfo.findEmployee);
      for (i in managers) {
        if (managers[i].name === "Cancel") {
          managers[i].name = "None";
        }
      };

      inquirer
        .prompt([
          {
            name: "managerName",
            type: "list",
            message: "Change manager to:",
            choices: managers.map(obj => obj.name)
          }
        ]).then(managerInfo => {
          let employeeID = employees.find(obj => obj.name === employeeInfo.findEmployee).id
          let managerID = managers.find(obj => obj.name === managerInfo.managerName).id
          db.query("UPDATE employee SET manager_id=? WHERE id=?", [managerID, employeeID]);
          console.log(`${employeeInfo.findEmployee} now reports to ${managerInfo.managerName}`);
          runApp();
        })
    })
  };

  async function addRole() {
    let departments = await db.query('Select id, name FROM department');

    inquirer
      .prompt([
        {
          name: "roleName",
          type: "input",
          message: "Enter new role:"
        },
        {
          name: "salaryAmt",
          type: "input",
          message: "Enter the salary for this role",
          validate: input => {
            if(!isNaN(input)) {
              return true;
            }
            return "Please enter a valid number"
          }
        },
        {
          name: "roleDepartment",
          type: "list",
          message: "Choose a department for this role:",
          choices: departments.map(obj => obj.name)
        }
      ]).then(answers => {
        let depID = departments.find(obj => obj.name === answers.roleDepartment).id
        db.query("INSERT INTO role (title, salary, department_id) VALUES (?)", [[answers.roleName, answers.salaryAmt, depID]]);
        console.log("\x1b[32m", `${answers.roleName} was added. Department: ${answers.roleDepartment}`);
        runApp();
      })
  };

  async function addDepartment() {
    inquirer
      .prompt([
        {
          name: "depName",
          type: "input",
          message: "Enter new department:"
        }
      ]).then(answers => {
        db.query("INSERT INTO department (name) VALUES (?)", [answers.depName]);
        console.log("\x1b[32m", `${answers.depName} was added to departments`);
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
        "Update Employee Manager",
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
        case "Update Employee Manager":
          updateManager();
          break;
        case "Add a New Role":
          addRole();
          break;
        case "Add a New Department":
          addDepartment();
          break;
      }
    });
}

runApp();