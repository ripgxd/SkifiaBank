const kb = require('./keyboard-buttons');

module.exports = {
    home: [
        [kb.home.balance, kb.home.transfer],
        [kb.home.wallutes, kb.home.help]
    ],

    create: [
        [kb.create, kb.back]
    ],

    cancel: [
        [kb.back]
    ]
}