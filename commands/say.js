module.exports = {
    name: 'say',
    description: 'Make the bot say something',
    execute(message, args) {
        if (!args.length) {
            return message.reply('❌ Please provide a message for me to say!');
        }
        
        const text = args.join(' ');
        
        // Delete the original command message
        message.delete().catch(() => {});
        
        // Send the message
        message.channel.send(text);
    },
};