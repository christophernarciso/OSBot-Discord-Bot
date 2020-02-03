require('dotenv').config();
const Trie = require('trie-search');
const Discord = require('discord.js');
const commandsData = require('./info/commands.json');
const classData = require('./info/classes.json');
const indexData = require('./info/index.json');
const exampleData = require('./info/examples.json');
const chrome = require('selenium-webdriver/chrome');
const sleep = require('sleep-promise');
const {Builder, By, Key, until, util} = require('selenium-webdriver');
const bot = new Discord.Client();
const token = process.env.TOKEN;
const user = process.env.USER;
const pass = process.env.PASS;
const prefix = process.env.PREFIX;
const screen = {
    width: 640,
    height: 480
};
const scripts = {
    dragons: 898,
    agility: 975,
    vorkath: 1090
};
const loginURL = 'https://osbot.org/forum/login/';
const homeURL = 'https://osbot.org/forum/';

// Setup our trie search for class.json
let classSearch = new Trie('name', {min: 3, ignoreCase: true});
classSearch.addAll(classData);
// Setup our trie search for index.json
let indexSearch = new Trie('name', {min: 3, ignoreCase: true});
indexSearch.addAll(indexData);
// Setup our trie search for example.json
let exampleSearch = new Trie('name', {min: 3, ignoreCase: true});
exampleSearch.addAll(exampleData);

/**
 * Discord API login state
 */
bot.login(token);

/**
 * Discord API ready state
 */
bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
});

/**
 * Discord API Message listener state
 */
bot.on('message', msg => {
    // If the message author was a bot we ignore it
    if (msg.author.bot)
        return;

    // If the prefix was not found we ignore the message on the server
    if (msg.content.charAt(0) !== prefix)
        return;

    let msgContent = msg.content;
    let fullCommand = msgContent.split(' ');
    let search;

    if (msgContent === '!commands') {
        msg.reply('Here are a list of options available for this bot!\n')
            .then(() => {
                let embed = new Discord.RichEmbed()
                    .setTitle('Command List')
                    .setColor('#f1c199')
                    .setTimestamp();
                for (let i = 0; i < commandsData.commands.length; i++) {
                    let command = commandsData.commands[i];
                    embed.addField(command['name'], command['desc']);
                }
                msg.channel.send(embed).then(() =>
                    console.log(`Replied to user ${msg.author.username} with available commands!`)
                );
            });
    } else if (msgContent === "!snippets") {
        msg.reply('https://osbot.org/forum/forum/251-snippets/');
    } else if (msgContent === '!tutorials') {
        msg.reply('https://osbot.org/forum/forum/250-tutorials/');
    } else if (msgContent === '!help') {
        msg.reply("Hey if you need scripting help then please head over to:\nhttps://osbot.org/forum/forum/249-scripting-help/" +
            " \nIf you were looking for commands please do !commands");
    } else if (msgContent.startsWith('!class')) {
        if (fullCommand.length > 1) {
            let search = classSearch.get(fullCommand[1]);

            if (!search.length) {
                msg.reply('Try providing a more accurate search term.');
                return;
            }

            let lengthOfSearch = search.length;
            let classTitle = lengthOfSearch > 1 ? 'Here are some classes from your search:' : 'Found a class from your search:';
            let embed = new Discord.RichEmbed()
                .setTitle(classTitle)
                .setColor('#a0e6f1')
                .setTimestamp();

            for (let i = 0; i < search.length; i++) {
                let data = search[i];
                embed.addField(data['name'], data['url']);
            }

            msg.reply(embed)
                .then(() => console.log(`Successfully found data for search: ` + fullCommand[1]));
        } else {
            msg.reply('Try providing a search term in your command. <!class bank>')
                .then(() => console.log(`Replied to user ${msg.author.username} with class command format!`));
        }
    } else if (msgContent.startsWith('!index')) {
        if (fullCommand.length > 1) {
            search = indexSearch.get(fullCommand[1]);

            if (!search.length) {
                msg.reply('Try providing a more accurate search term.');
                return;
            }

            let lengthOfSearch = search.length;
            let indexTitle = lengthOfSearch > 1 ? 'Here are some results from your search:' : 'Found a result from your search:';
            let embed = new Discord.RichEmbed()
                .setTitle(indexTitle)
                .setColor('#f16192')
                .setTimestamp();

            for (let i = 0; i < 10; i++) {
                let data = search[i];
                // Incase there are less than 10 results.
                if (!data)
                    continue;
                embed.addField(data['name'], data['desc'] + '\n' + data['url']);
            }

            msg.reply(embed)
                .then(() => console.log(`Successfully found data for search: ` + fullCommand[1]));
        } else {
            msg.reply('Try providing a search term in your command. <!index open>')
                .then(() => console.log(`Replied to user ${msg.author.username} with index command format!`));
        }
    } else if (msgContent.startsWith("!example")) {
        if (fullCommand.length > 1) {
            search = exampleSearch.get(fullCommand[1]);

            if (!search.length) {
                msg.reply(`The example ${fullCommand[1]} can not be found. Please try something else.`);
                return;
            }

            let lengthOfSearch = search.length;
            let exampleTitle = lengthOfSearch > 1 ? 'Here are some snippets from your search:' : 'Found a snippet from your search:';
            let embed = new Discord.RichEmbed()
                .setTitle(exampleTitle)
                .setColor('#9c8ff1')
                .setTimestamp();

            for (let i = 0; i < 10; i++) {
                let data = search[i];
                // Incase there are less than 10 results.
                if (!data)
                    continue;
                embed.addField(data['name'], '```' + data['code'] + '```');
            }

            msg.reply(embed)
                .then(() => console.log(`Successfully found data for search: ` + fullCommand[1]));
        } else {
            msg.reply('Please provide the command in the proper format.\n For example,\n!example banking')
                .then(() => console.log(`Replied to user ${msg.author.username} with example command format!`));
        }
    } else if (msgContent.startsWith("!auth")) {
        if (fullCommand.length > 2) {

            let memberID = fullCommand[1].replace(/\D/g, '');
            let scriptID = getScriptIDByName(fullCommand[2]);
            let isValid = fullCommand[1].startsWith('https://osbot.org/forum/profile/');

            if (scriptID !== -1 && isValid) {
                let duration = '2';
                let authURL = `https://osbot.org/mvc/scripters/auth?task=addauth&memberID=${memberID}&scriptID=${scriptID}&authDuration=${duration}`;
                auth(authURL).then(() => msg.reply(`I have applied a ${duration} hr auth for the script id ${scriptID}`));
            } else {
                msg.reply(`Sorry I could not find a scriptID for the name: ${fullCommand[2]}`).then(() => {
                    let scriptString = 'Here are some scripts that are available for trial:\n';
                    for (let key in scripts) {
                        let value = scripts[key];
                        scriptString += `NAME: ${key} -- ID: ${value}\n`;
                    }
                    msg.channel.send(scriptString).then(() =>
                        console.log(`Replied to user ${msg.author.username} with available script ids!`)
                    );
                });
            }
        } else {
            msg.reply('Please provide the command in the proper format.\n For example,\n!auth https://osbot.org/forum/profile/134079-chris/ vorkath')
                .then(() => console.log(`Replied to user ${msg.author.username} with auth command format!`));
        }
    }
});

/**
 * @param name - the name of the script
 * @returns {number} - the id of the script by name
 */
function getScriptIDByName(name) {
    for (let key in scripts) {
        let value = scripts[key];
        if (key === name)
            return value;
    }

    return -1;
}

/**
 * @param authURL - created and passed
 * @returns {Promise<void>} - If the promise was resolved then it will trigger the auth reply message.
 */
async function auth(authURL) {
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().headless().windowSize(screen))
        .build();

    console.log(authURL);

    await driver.get(loginURL)
        .then(sleep(5000))
        .then(_ => driver.findElement(By.id('auth')))
        .then(u => u.sendKeys(user))
        .then(_ => driver.findElement(By.id('password')))
        .then(p => p.sendKeys(pass, Key.RETURN))
        .then(_ => sleep(3000))
        .then(_ => driver.get(homeURL))
        .then(_ => driver.wait(until.titleIs('Forums - OSBot :: 2007 OSRS Botting'), 10000))
        .then(_ => driver.switchTo().newWindow('tab'))
        .then(_ => driver.get(authURL))
        .then(_ => driver.wait(until.titleIs('Scripters\' Auth'), 10000))
        .then(_ => sleep(4000))
        .then(_ => driver.quit());
}
