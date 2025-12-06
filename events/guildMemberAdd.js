const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');

// Import welcome settings utility
const welcomeCommand = require('../commands/welcome.js');

// ═══════════════════════════════════════════════════════════════════════════════
//                              UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a visual progress bar for membership position
 * @param {number} position - Current member position
 * @param {number} total - Total members
 * @returns {string} Progress bar string
 */
function createMembershipProgress(position, total) {
    const percentage = Math.round((position / total) * 100);
    const filledBars = Math.round(percentage / 10);
    const emptyBars = 10 - filledBars;
    
    const progressBar = '🟩'.repeat(filledBars) + '⬜'.repeat(emptyBars);
    return `${progressBar} ${percentage}%`;
}

/**
 * Creates a welcome banner URL (placeholder for now)
 * @param {GuildMember} member - The new member
 * @param {number} position - Member join position
 * @returns {string|null} Banner URL or null
 */
function createWelcomeBanner(member, position) {
    // For now, return null - can be enhanced later with actual banner generation
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
//                           GUILD MEMBER ADD EVENT
// ═══════════════════════════════════════════════════════════════════════════════
// This event handles new member joins with advanced features:
// • Welcome DM with server information
// • Public welcome message in designated channel
// • Auto-role assignment
// • Member count updates
// • Server statistics tracking
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // Check if welcome system is enabled for this guild
            if (!welcomeCommand.isWelcomeEnabled(member.guild.id)) {
                console.log(`⏸️ Welcome system disabled for ${member.guild.name} - skipping welcome messages`);
                return;
            }
            // ═══════════════════════════════════════════════════════════════════════
            //                          CONFIGURATION SECTION
            // ═══════════════════════════════════════════════════════════════════════
            const config = {
                welcomeChannelId: '1340816672751353917', // Replace with your welcome channel ID
                autoRoleId: null, // Replace with role ID for auto-assignment (null to disable)
                colors: {
                    welcome: '#00ff88',
                    public: '#ff6b6b',
                    error: '#ff4757'
                },
                channels: {
                    rules: 'https://discord.com/channels/1201626435958354021/1201647312842277046',
                    roles: 'https://discord.com/channels/1201626435958354021/1338316546023620619',
                    games: 'https://discord.com/channels/1201626435958354021/1203350275113623662',
                    about: 'https://discord.com/channels/1201626435958354021/1201631430615244880'
                }
            };

            // ═══════════════════════════════════════════════════════════════════════
            //                          MEMBER INFORMATION
            // ═══════════════════════════════════════════════════════════════════════
            const guild = member.guild;
            const memberCount = guild.memberCount;
            const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
            const joinPosition = memberCount;
            
            console.log(`🎉 New member joined: ${member.user.tag} (ID: ${member.id})`);
            console.log(`📊 Server now has ${memberCount} members`);

            // ═══════════════════════════════════════════════════════════════════════
            //                          ENHANCED WELCOME DM EMBED
            // ═══════════════════════════════════════════════════════════════════════
            const membershipBadge = joinPosition <= 100 ? '🏆 Early Member' : 
                                   joinPosition <= 500 ? '⭐ Active Community' : 
                                   joinPosition <= 1000 ? '🎯 Growing Family' : '🌟 Welcome Aboard';
            
            const accountStatus = accountAge < 7 ? '🆕 New Account' : 
                                 accountAge < 30 ? '📅 Recent Account' : 
                                 accountAge < 365 ? '✅ Established Account' : '🏅 Veteran Account';
            
            const welcomeDMEmbed = new EmbedBuilder()
                 .setTitle(`🎉 Welcome to ${guild.name}!`)
                 .setDescription(`Hello **${member.user.username}**! 👋\n\nWelcome to our community of freethinkers and intellectual explorers. We're excited to have you here!\n\n**You are member #${joinPosition}** 🎊`)
                .addFields(
                    {
                        name: '📜 Important Links',
                        value: `[Community Rules](${config.channels.rules})\n[Get Roles](${config.channels.roles})\n[Gaming](${config.channels.games})\n[About Us](${config.channels.about})`,
                        inline: true
                    },
                    {
                        name: '📊 Your Info',
                        value: `**Position:** #${joinPosition}\n**Account Age:** ${accountAge} days\n**Status:** ${accountStatus}`,
                        inline: true
                    },
                    {
                        name: '🚀 Getting Started',
                        value: '1. Read the rules\n2. Choose your roles\n3. Introduce yourself\n4. Join discussions\n5. Have fun!',
                        inline: false
                    }
                )
                 .setColor('#00D26A')
                 .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                 .setImage('https://cdn.discordapp.com/attachments/1385430893446959234/1401367803885260991/Welcome_Anime_GIF_-_Welcome_Anime_Anime_Welcome_-_GIF.gif?ex=689896b8&is=68974538&hm=fe5755987269541368d0111fb3c92f595a5e24df78dd82183c01bd7e388a2971&')
                 .setFooter({ 
                     text: `Welcome to ${guild.name}!`, 
                     iconURL: guild.iconURL({ dynamic: true }) 
                 })
                 .setTimestamp();

            // ═══════════════════════════════════════════════════════════════════════
            //                          ENHANCED PUBLIC WELCOME EMBED
            // ═══════════════════════════════════════════════════════════════════════
            const milestoneMessage = memberCount % 100 === 0 ? `🎉 **MILESTONE!** We've reached ${memberCount} members!` : 
                                   memberCount % 50 === 0 ? `🎊 **Half-Century!** ${memberCount} members strong!` : 
                                   memberCount % 10 === 0 ? `✨ **Growing!** ${memberCount} members and counting!` : '';
            
            const welcomeProgress = createMembershipProgress(joinPosition, memberCount);
            
            const publicWelcomeEmbed = new EmbedBuilder()
                 .setTitle('🎊 New Member Joined!')
                 .setDescription(`Welcome **${member.user.username}** to our community! 🎉\n\n${member} is now member **#${joinPosition}**!\n\n${milestoneMessage ? milestoneMessage : ''}`)
                .addFields(
                    {
                        name: '👤 Member Info',
                        value: `**Username:** ${member.user.username}\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**Join Position:** #${joinPosition}`,
                        inline: true
                    },
                    {
                        name: '📊 Server Stats',
                        value: `**Total Members:** ${memberCount}\n**Humans:** ${guild.members.cache.filter(m => !m.user.bot).size}\n**Bots:** ${guild.members.cache.filter(m => m.user.bot).size}`,
                        inline: true
                    }
                )
                 .setColor('#FF6B6B')
                 .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                 .setFooter({ 
                     text: `Welcome to ${guild.name}!`, 
                     iconURL: guild.iconURL({ dynamic: true }) 
                 })
                 .setTimestamp();

            // ═══════════════════════════════════════════════════════════════════════
            //                          SEND WELCOME DM
            // ═══════════════════════════════════════════════════════════════════════
            try {
                await member.send({ embeds: [welcomeDMEmbed] });
                console.log(`✅ Welcome DM sent successfully to ${member.user.tag}`);
            } catch (dmError) {
                console.log(`❌ Could not send welcome DM to ${member.user.tag}: ${dmError.message}`);
                
                // Create error embed for logging
                const errorEmbed = new EmbedBuilder()
                    .setTitle('⚠️ DM Delivery Failed')
                    .setDescription(`Could not send welcome DM to ${member.user.tag}\n**Reason:** ${dmError.message}`)
                    .setColor(config.colors.error)
                    .setTimestamp();
                
                // Try to log the error in welcome channel
                const welcomeChannel = guild.channels.cache.get(config.welcomeChannelId);
                if (welcomeChannel && welcomeChannel.type === ChannelType.GuildText) {
                    try {
                        await welcomeChannel.send({ embeds: [errorEmbed] });
                    } catch (logError) {
                        console.log(`❌ Could not log DM error: ${logError.message}`);
                    }
                }
            }

            // ═══════════════════════════════════════════════════════════════════════
            //                          SEND PUBLIC WELCOME
            // ═══════════════════════════════════════════════════════════════════════
            const welcomeChannel = guild.channels.cache.get(config.welcomeChannelId);
            if (welcomeChannel && welcomeChannel.type === ChannelType.GuildText) {
                try {
                    await welcomeChannel.send({ 
                        content: `🎉 ${member}`, 
                        embeds: [publicWelcomeEmbed] 
                    });
                    console.log(`✅ Public welcome message sent for ${member.user.tag}`);
                } catch (publicError) {
                    console.log(`❌ Could not send public welcome: ${publicError.message}`);
                }
            } else {
                console.log(`⚠️ Welcome channel not found or invalid (ID: ${config.welcomeChannelId})`);
            }

            // ═══════════════════════════════════════════════════════════════════════
            //                          AUTO-ROLE ASSIGNMENT
            // ═══════════════════════════════════════════════════════════════════════
            if (config.autoRoleId) {
                try {
                    const autoRole = guild.roles.cache.get(config.autoRoleId);
                    if (autoRole) {
                        await member.roles.add(autoRole);
                        console.log(`✅ Auto-role "${autoRole.name}" assigned to ${member.user.tag}`);
                    } else {
                        console.log(`⚠️ Auto-role not found (ID: ${config.autoRoleId})`);
                    }
                } catch (roleError) {
                    console.log(`❌ Could not assign auto-role to ${member.user.tag}: ${roleError.message}`);
                }
            }

            // ═══════════════════════════════════════════════════════════════════════
            //                          MEMBER STATISTICS
            // ═══════════════════════════════════════════════════════════════════════
            console.log(`📈 Member Statistics:`);
            console.log(`   • Total Members: ${memberCount}`);
            console.log(`   • Humans: ${guild.members.cache.filter(m => !m.user.bot).size}`);
            console.log(`   • Bots: ${guild.members.cache.filter(m => m.user.bot).size}`);
            console.log(`   • Account Age: ${accountAge} days`);
            console.log(`   • Join Position: #${joinPosition}`);

        } catch (error) {
            console.error(`❌ Error in guildMemberAdd event: ${error.message}`);
            console.error(error.stack);
        }
    },
};