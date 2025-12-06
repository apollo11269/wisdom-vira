const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const birthdaySettingsFile = path.join(__dirname, '..', 'data', 'birthday-settings.json');

// Load birthday settings from file
function loadBirthdaySettings() {
    try {
        if (fs.existsSync(birthdaySettingsFile)) {
            return JSON.parse(fs.readFileSync(birthdaySettingsFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading birthday settings:', error);
    }
    return {};
}

// Check for birthdays and send messages
async function checkBirthdays(client) {
    try {
        const settings = loadBirthdaySettings();
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth() + 1;

        console.log(`[Birthday Checker] Checking birthdays for ${currentDay}/${currentMonth}`);

        // Check each guild's birthdays
        for (const [guildId, guildSettings] of Object.entries(settings)) {
            if (!guildSettings.birthdays || !guildSettings.channelId) continue;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;

            const birthdayChannel = guild.channels.cache.get(guildSettings.channelId);
            if (!birthdayChannel) continue;

            // Find today's birthdays
            const todaysBirthdays = [];
            for (const [userId, birthday] of Object.entries(guildSettings.birthdays)) {
                if (birthday.day === currentDay && birthday.month === currentMonth) {
                    const member = guild.members.cache.get(userId);
                    if (member) {
                        todaysBirthdays.push({ member, birthday });
                    }
                }
            }

            // Send birthday messages
            for (const { member, birthday } of todaysBirthdays) {
                try {
                    const birthdayEmbed = new EmbedBuilder()
                        .setTitle('🎉 Happy Birthday! 🎂')
                        .setDescription(`Today is **${member.displayName}**'s birthday!\n\nLet's all wish them a wonderful day! 🎈`)
                        .addFields(
                            { 
                                name: '🎂 Birthday Person', 
                                value: `${member}`, 
                                inline: true 
                            },
                            { 
                                name: '📅 Date', 
                                value: `${currentDay}/${currentMonth}`, 
                                inline: true 
                            },
                            { 
                                name: '🎁 Birthday Wishes', 
                                value: 'React with 🎉 to wish them a happy birthday!', 
                                inline: false 
                            }
                        )
                        .setColor('#FF69B4')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                        .setFooter({ 
                            text: `🎂 ${guild.name} Birthday Celebration | WisdomJebril V3 By APollo <3`, 
                            iconURL: guild.iconURL({ dynamic: true }) 
                        })
                        .setTimestamp();

                    const birthdayMessage = await birthdayChannel.send({ 
                        content: `🎉 @everyone It's ${member.displayName}'s birthday today! 🎂`,
                        embeds: [birthdayEmbed] 
                    });

                    // Add birthday reactions
                    await birthdayMessage.react('🎉');
                    await birthdayMessage.react('🎂');
                    await birthdayMessage.react('🎈');
                    await birthdayMessage.react('🎁');
                    await birthdayMessage.react('❤️');

                    console.log(`[Birthday Checker] Sent birthday message for ${member.displayName} in ${guild.name}`);

                    // Send a DM to the birthday person
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('🎂 Happy Birthday from ' + guild.name + '! 🎉')
                            .setDescription(`Happy Birthday, **${member.displayName}**!\n\nWe hope you have a wonderful day filled with joy and celebration! 🎈\n\nYour birthday has been announced in the ${birthdayChannel} channel.`)
                            .setColor('#FF69B4')
                            .setThumbnail(guild.iconURL({ dynamic: true }))
                            .setFooter({ 
                                text: 'WisdomJebril V3 By APollo <3', 
                                iconURL: client.user.displayAvatarURL({ dynamic: true }) 
                            })
                            .setTimestamp();

                        await member.send({ embeds: [dmEmbed] });
                        console.log(`[Birthday Checker] Sent birthday DM to ${member.displayName}`);
                    } catch (dmError) {
                        console.log(`[Birthday Checker] Could not send DM to ${member.displayName}: ${dmError.message}`);
                    }

                } catch (error) {
                    console.error(`[Birthday Checker] Error sending birthday message for ${member.displayName}:`, error);
                }
            }

            if (todaysBirthdays.length > 0) {
                console.log(`[Birthday Checker] Processed ${todaysBirthdays.length} birthday(s) in ${guild.name}`);
            }
        }

    } catch (error) {
        console.error('[Birthday Checker] Error in birthday checker:', error);
    }
}

// Initialize birthday checker
function initializeBirthdayChecker(client) {
    console.log('[Birthday Checker] Initializing birthday checker...');
    
    // Set up daily check at midnight (00:00)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Schedule first check at next midnight
    setTimeout(() => {
        checkBirthdays(client);
        
        // Then check every 24 hours
        setInterval(() => {
            checkBirthdays(client);
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
        
    }, msUntilMidnight);
    
    console.log(`[Birthday Checker] Next birthday check scheduled for: ${tomorrow.toLocaleString()}`);
}

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} is online and ready!`);
        console.log(`📊 Serving ${client.guilds.cache.size} servers with ${client.users.cache.size} users`);
        
        // Set bot activity
        client.user.setActivity('WisdomJebril V3 | !help', { type: 'WATCHING' });
        
        // Initialize birthday checker
        initializeBirthdayChecker(client);
    },
};