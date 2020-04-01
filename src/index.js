'use strict'

//////////////////  REQUIREMENTS  ////////////////////////////
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require("mongoose");
const config = require('../config');
const kb = require('./keyboard-buttons');
const keyboard = require('./keyboards');

//////////////////  CONNECTION  ///////////////////////////////

mongoose.connect(config.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err))

require("../models/users.model");
const User = mongoose.model('users');

const bot = new TelegramBot(config.TOKEN, {
    polling: true
});

console.log('Bot has been started');

///////////////////////////////////////////////////////////////


bot.on('message', com => {

    const chatId = com.chat.id;
    const userId = com.from.id;
    const userFrom = com.from;

    switch(com.text){
        case kb.home.balance:
            showBalance(chatId, userId);
            break;

        case kb.home.transfer:
            sendMoney(chatId);
            break;

        case kb.home.wallutes:
            bot.sendMessage(chatId, "В процесі");
            break;

        case kb.home.help:
            bot.sendMessage(chatId, "Звератися до @ripgxd");
            break;
        
        case kb.create:
            createUser(chatId, userFrom);
            break;

        case kb.back:
            bot.sendMessage(chatId, 'Відміна', {
                reply_markup: {
                    keyboard: keyboard.home,
                    one_time_keyboard: true
                }
            });

            break;
    }
});

bot.onText(/\/start/, com => {

    const chatId = com.chat.id;

    bot.sendMessage(chatId, 'keyboard', {
        reply_markup: {
            keyboard: keyboard.home,
            one_time_keyboard: true
        }
    })
});

function showBalance(chatId, userId){

    User.findOne({ userId: userId}, (err, doc) =>{
        
        if(err) console.log(err);

        if(doc === null) {
            const text = 'У вас ще немає особового рахунку. Бажаєте створити?';
            bot.sendMessage(chatId, text, {
                reply_markup: {
                    keyboard: keyboard.create,
                    one_time_keyboard: true
                }
            })
        } else{

            const html = `<strong>БАНК СКІФІЇ</strong>

${doc.userFirstName} ${doc.userLastName}

<i>Номер рахунку:</i> <b>G${doc.userId}</b>

<i>Баланс:</i> <b>${doc.userFunds}</b> <i>Гачиків</i>`

            bot.sendMessage(chatId, html, { parse_mode: "HTML" });
        }

    });
    
};

function createUser(chatId, userFrom){
    let last_name = "";

    if (userFrom.last_name === ""){
        last_name = " ";
    } else {
        last_name = userFrom.last_name;
    }
    User.create({
        userId: userFrom.id,
        userFunds: 200,
        userFirstName: userFrom.first_name,
        userLastName: last_name
    }, (err, doc) => {

        if(err) return console.log(err);
      
        console.log("Користувач збережений ", doc);

        bot.sendMessage(chatId, `Рахунок створено!\nВаш рахунок G${userFrom.id}`, {
            reply_markup: {
                keyboard: keyboard.home,
                one_time_keyboard: true
            }
        })
    })

}

function sendMoney(chatId){

    let recipient = null;
    let sender = null;
    let money = null;

    const text = `Введіть номер рахунку:`
    bot.sendMessage(chatId, text, {
        reply_markup: {
            keyboard: keyboard.cancel,
            one_time_keyboard: true
        }
    });

    bot.onText(/G(.+)/, msg => {
        if(recipient === null && sender === null){
            recipient = Number(msg.text.replace('G', ''));
            sender = msg.from.id; 

            bot.sendMessage(chatId, "Введіть суму");
        }

    });

    bot.onText(/^\d+$/, com => {
        if(money === null){
            
            money = Number(com.text);
            User.findOne({userId: sender}).then((s)=>{
                let senderFunds = null;
                let recipientFunds = null;
                let senderName = `${s.userFirstName} ${s.userLastName}`;

                if(s.userFunds < money){
                    bot.sendMessage(chatId, 'Недостатньо коштів')
                    bot.sendMessage(chatId, 'Відміна', {
                        reply_markup: {
                            keyboard: keyboard.home,
                            one_time_keyboard: true
                        }
                    });
        
                } else{
                    
                    senderFunds = s.userFunds - money;
                    User.updateOne({userId: s.userId}, {userFunds: senderFunds})
                    .catch(err => {console.log(err)});

                    User.findOne({userId: recipient}).then((r) => {
                        recipientFunds = r.userFunds + money;
                        User.updateOne({userId: r.userId}, {userFunds: recipientFunds}).then(()=>{    
                            const recipientName = `${r.userFirstName} ${r.userLastName}`  
                            bot.sendMessage(recipient, `${senderName} надіслав вам ${money} Гач.`);
                            bot.sendMessage("@SkifiaBankLogs", `${senderName} надіслав ${recipientName} - ${money} Гач.`);
                        })
                        .catch((err) => {console.log(err)})
                    }).catch(err=>{console.log(err)});

                    bot.sendMessage(chatId, "Операція пройшла успішно", {
                        reply_markup: {
                            keyboard: keyboard.home,
                            one_time_keyboard: true
                            }
                        });
                            
                }
                    
            }).catch(err=>{console.log(err)})

        }
        
    })
    
}



