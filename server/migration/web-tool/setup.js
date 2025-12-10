const inquirer = require('inquirer');
const chalk = require('chalk');
const execa = require('execa');
const ora = require('ora');
const path = require('path');
const fs = require('fs');

// --- Helper Functions ---
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clearScreen = () => {
    process.stdout.write('\x1Bc');
};

const printHeader = () => {
    clearScreen();
    console.log(chalk.cyan('=========================================='));
    console.log(chalk.cyan.bold('      PAWNSHOP APP SETUP WIZARD'));
    console.log(chalk.cyan('=========================================='));
    console.log('');
};

const { checkDependencies } = require('./lib/dependencies');

async function installDependencies() {
    printHeader();
    const results = await checkDependencies();

    console.log('');
    for (const [name, info] of Object.entries(results)) {
        if (info.installed) {
            console.log(`${chalk.green('✔')} ${name}: ${chalk.green(info.version)}`);
        } else {
            console.log(`${chalk.red('✘')} ${name}: ${chalk.red('Not Installed')} (${info.error})`);
        }
    }

    // Logic to install missing dependencies
    const missing = Object.values(results).some(r => !r.installed);
    if (missing) {
        console.log(chalk.yellow('\nSome dependencies are missing. Install them via winget? (Not implemented yet)'));
    } else {
        console.log(chalk.green('\nAll dependencies look good!'));
    }

    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
}

const { runFullMigration, restoreSqlServer } = require('./lib/migration');

async function runMigration() {
    printHeader();
    const { backupFile } = await inquirer.prompt([
        {
            type: 'list',
            name: 'backupFile',
            message: 'Select a backup file to restore:',
            choices: [
                'pmDATAbak.dat',
                'pawn_backup_2024.zip',
                new inquirer.Separator(),
                'Browse...'
            ]
        }
    ]);

    if (backupFile === 'Browse...') {
        console.log(chalk.yellow('File browser not implemented yet.'));
        await wait(1000);
        return;
    }

    console.log(chalk.blue(`\nSelected backup: ${backupFile}`));

    // Confirm
    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'This will overwrite the database. Are you sure?',
        default: false
    }]);

    if (!confirm) return;

    console.log(chalk.bold('\nStarting Migration Process...'));

    // 1. Restore SQL Server
    const restoreSuccess = await restoreSqlServer(backupFile);
    if (!restoreSuccess) {
        console.log(chalk.red('SQL Server restore failed.'));
        await inquirer.prompt([{ type: 'input', name: 'c', message: 'Enter to continue...' }]);
        return;
    }

    // 2. Run Python Migration Scripts
    const success = await runFullMigration();

    if (success) {
        console.log(chalk.green('\n✅ Migration Completed Successfully!'));
    } else {
        console.log(chalk.red('\n❌ Migration Failed. Check logs above.'));
    }

    await inquirer.prompt([{ type: 'input', name: 'cont', message: 'Press Enter to continue...' }]);
}

const { createAdminUser } = require('./lib/admin');

async function configureAdmin() {
    printHeader();
    console.log(chalk.cyan('Configure Admin User'));
    const answers = await inquirer.prompt([
        { type: 'input', name: 'username', message: 'Username:', default: 'admin' },
        { type: 'password', name: 'password', message: 'Password:' }
    ]);

    // Create admin using Python script
    const success = await createAdminUser(answers.username, answers.password);

    if (success) {
        console.log(chalk.green(`\n✅ User ${answers.username} created/updated successfully!`));
    } else {
        console.log(chalk.red('\n❌ Failed to configure admin user.'));
    }

    await inquirer.prompt([{ type: 'input', name: 'c', message: 'Press Enter to continue...' }]);
}

const { installApplication } = require('./lib/install');

async function installApp() {
    printHeader();
    const spinner = ora('Installing Application...').start();

    // Stop spinner to allow log output from sub-processes
    spinner.stop();

    const success = await installApplication();

    if (success) {
        console.log(chalk.green('\n✅ Application Installed & Shortcuts Created!'));
    } else {
        console.log(chalk.red('\n❌ Installation Failed.'));
    }
    await inquirer.prompt([{ type: 'input', name: 'c', message: 'Press Enter to continue...' }]);
}

// --- Main Menu ---
async function mainMenu() {
    while (true) {
        printHeader();
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '1. Install Dependencies', value: 'deps' },
                    { name: '2. Migration', value: 'migration' },
                    { name: '3. Configure Default Admin', value: 'admin' },
                    { name: '4. Install Application', value: 'install' },
                    new inquirer.Separator(),
                    { name: 'Exit', value: 'exit' }
                ]
            }
        ]);

        if (action === 'exit') {
            console.log(chalk.green('Goodbye!'));
            process.exit(0);
        }

        switch (action) {
            case 'deps': await installDependencies(); break;
            case 'migration': await runMigration(); break;
            case 'admin': await configureAdmin(); break;
            case 'install': await installApp(); break;
        }
    }
}

if (require.main === module) {
    mainMenu();
}
