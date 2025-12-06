const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { loadApplySettings } = require('../commands/setupapply');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle button interactions
        if (interaction.isButton()) {
            const { customId } = interaction;
            
            // Handle staff application buttons
            if (customId.startsWith('apply_')) {
                const language = customId.split('_')[1];
                
                // Create modal based on selected language
                const modal = new ModalBuilder()
                    .setCustomId(`apply_modal_${language}`)
                    .setTitle(getModalTitle(language));

                const questions = getQuestions(language);
                const components = [];

                // Create text inputs for each question (Discord modals support max 5 components)
                for (let i = 0; i < Math.min(5, questions.length); i++) {
                    const textInput = new TextInputBuilder()
                            .setCustomId(`question_${i + 1}`)
                            .setLabel(questions[i].substring(0, 45)) // Discord label limit
                            .setPlaceholder(questions[i].substring(0, 100)) // Discord placeholder limit
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(1000);

                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    components.push(actionRow);
                }

                modal.addComponents(...components);
                try {
                    await interaction.showModal(modal);
                } catch (error) {
                    console.error('Error showing modal:', error);
                    await interaction.reply({ 
                        content: 'There was an error displaying the application form. Please try again.', 
                        ephemeral: true 
                    });
                }
                return;
            }
            
            // Handle continue application button
            if (customId.startsWith('continue_application_')) {
                const language = customId.split('_')[2];
                const questions = getQuestions(language);
                
                // Get stored first part answers
                const tempData = interaction.client.tempApplications?.get(interaction.user.id);
                if (!tempData) {
                    await interaction.reply({ 
                        content: language === 'arabic' ? 'انتهت صلاحية الطلب. يرجى البدء من جديد.' : 
                                language === 'english' ? 'Application expired. Please start over.' : 
                                language === 'darija' ? 'الطلب خلص الوقت ديالو. ابدا من جديد.' :
                                'Asuter yemmut. Ales seg tazwara.',
                        ephemeral: true 
                    });
                     return;
                 }

                // Create second modal with questions 6-10
                const secondModal = new ModalBuilder()
                    .setCustomId(`apply_modal_${language}_part2`)
                    .setTitle(getModalTitle(language) + ' (Part 2)');

                const components = [];
                for (let i = 5; i < Math.min(10, questions.length); i++) {
                    const textInput = new TextInputBuilder()
                        .setCustomId(`question_${i + 1}`)
                        .setLabel(questions[i].substring(0, 45))
                        .setPlaceholder(questions[i].substring(0, 100))
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(1000);

                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    components.push(actionRow);
                }

                secondModal.addComponents(...components);
                
                try {
                    await interaction.showModal(secondModal);
                } catch (error) {
                    console.error('Error showing second modal:', error);
                    await interaction.reply({ 
                        content: 'There was an error displaying the form. Please try again.', 
                        ephemeral: true 
                    });
                }
                return;
            }
            
            // Handle help menu interactions
            if (customId.startsWith('help_')) {
                await handleHelpInteraction(interaction);
                return;
            }
            
            // Handle poll button interactions
            if (customId.startsWith('poll_results_') || customId.startsWith('poll_end_')) {
                const messageId = customId.split('_')[2];
                const pollData = interaction.client.polls?.get(messageId);
                
                if (!pollData) {
                    return interaction.reply({ content: '❌ Poll data not found or poll has already ended.', ephemeral: true });
                }
                
                if (customId.startsWith('poll_results_')) {
                    // Show current results without ending the poll
                    showPollResults(interaction, pollData, messageId, false);
                } else if (customId.startsWith('poll_end_')) {
                    // Check if user is poll creator or has admin permissions
                    if (interaction.user.id !== pollData.creator && !interaction.member.permissions.has('Administrator')) {
                        return interaction.reply({ content: '❌ Only the poll creator or administrators can end this poll.', ephemeral: true });
                    }
                    
                    // End the poll and show final results
                    endPollFromButton(interaction, pollData, messageId);
                }
            }
        }

        // Handle modal submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('apply_modal_')) {
                const language = interaction.customId.split('_')[2];
                const questions = getQuestions(language);
                
                // Check if this is part 2 submission
                if (interaction.customId.includes('_part2')) {
                    // Get stored first part answers
                    const tempData = interaction.client.tempApplications?.get(interaction.user.id);
                    if (!tempData) {
                    await interaction.reply({ 
                        content: 'Session expired. Please start over.', 
                        ephemeral: true 
                    });
                        return;
                    }

                    // Collect answers from questions 6-10
                    const secondAnswers = [];
                    for (let i = 6; i <= Math.min(10, questions.length); i++) {
                        const answer = interaction.fields.getTextInputValue(`question_${i}`);
                        secondAnswers.push(answer);
                    }

                    // Combine all answers
                    const allAnswers = [...tempData.answers, ...secondAnswers];
                    
                    // Clean up temporary data
                    interaction.client.tempApplications.delete(interaction.user.id);
                    
                    // Process complete application
                    await processApplication(interaction, language, allAnswers, questions);
                    return;
                }
                
                // Handle part 1 submission (first 5 questions)
                const answers = [];
                for (let i = 1; i <= 5; i++) {
                    const answer = interaction.fields.getTextInputValue(`question_${i}`);
                    answers.push(answer);
                }

                // If there are more than 5 questions, show button for next part
                if (questions.length > 5) {
                    // Store first part answers temporarily
                    interaction.client.tempApplications = interaction.client.tempApplications || new Map();
                    interaction.client.tempApplications.set(interaction.user.id, {
                        language,
                        answers,
                        timestamp: Date.now()
                    });

                    const { ButtonBuilder, ButtonStyle } = require('discord.js');
                    const continueButton = new ButtonBuilder()
                        .setCustomId(`continue_application_${language}`)
                        .setLabel('Continue to Next Questions')
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(continueButton);

                    const embed = new EmbedBuilder()
                        .setTitle('Part 1 Completed')
                        .setDescription('You have completed the first 5 questions. Click the button below to continue with the remaining questions.')
                        .setColor('#00ff00');

                    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
                    return;
                }

                // Process complete application (5 or fewer questions)
                await processApplication(interaction, language, answers, questions);
            }
            
            // Handle second part of modal
            if (interaction.customId.includes('_part2')) {
                const language = interaction.customId.split('_')[2];
                const questions = getQuestions(language);
                
                // Get stored first part answers
                const tempApp = interaction.client.tempApplications?.get(interaction.user.id);
                if (!tempApp) {
                    await interaction.reply({ 
                        content: language === 'arabic' ? 'انتهت صلاحية الجلسة. يرجى إعادة بدء الطلب.' : 
                                language === 'english' ? 'Session expired. Please start the application again.' : 
                                language === 'darija' ? 'سالي الوقت ديال السيشن. بدا الطلب من جديد.' :
                                'ⵜⵓⵙⵙⵉ ⵜⵉⵡⵔⵉⵙⵜ. ⴰⴷ ⵜⵙⴱⵔⴷ ⵏ ⵜⵎⵎⵉⵔⵜ ⵏ ⵓⵙⵓⵜⵔ.',
                        ephemeral: true 
                    });
                    return;
                }

                // Collect answers from second part
                const secondPartAnswers = [];
                for (let i = 6; i <= Math.min(10, questions.length); i++) {
                    const answer = interaction.fields.getTextInputValue(`question_${i}`);
                    secondPartAnswers.push(answer);
                }

                // Combine all answers
                const allAnswers = [...tempApp.answers, ...secondPartAnswers];
                
                // Clean up temporary storage
                interaction.client.tempApplications.delete(interaction.user.id);

                // Process complete application
                await processApplication(interaction, language, allAnswers, questions);
            }
        }

        // Handle string select menus
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'help_category_select') {
                await handleHelpCategorySelect(interaction);
                return;
            }
        }
    }
};

// Function to show poll results without ending
async function showPollResults(interaction, pollData, messageId, isEnding = false) {
    try {
        const message = await interaction.channel.messages.fetch(messageId);
        const reactions = message.reactions.cache;
        let totalVotes = 0;
        const results = [];
        
        if (pollData.options.length > 0) {
            // Custom options poll
            for (let i = 0; i < pollData.options.length; i++) {
                const reaction = reactions.get(pollData.numberEmojis[i]);
                const count = reaction ? reaction.count - 1 : 0; // Subtract bot's reaction
                results.push({ option: pollData.options[i], votes: count, emoji: pollData.numberEmojis[i] });
                totalVotes += count;
            }
        } else {
            // Yes/No poll
            const yesReaction = reactions.get('✅');
            const noReaction = reactions.get('❌');
            const yesVotes = yesReaction ? yesReaction.count - 1 : 0;
            const noVotes = noReaction ? noReaction.count - 1 : 0;
            
            results.push({ option: 'Yes', votes: yesVotes, emoji: '✅' });
            results.push({ option: 'No', votes: noVotes, emoji: '❌' });
            totalVotes = yesVotes + noVotes;
        }
        
        // Sort results by vote count
        results.sort((a, b) => b.votes - a.votes);
        
        let resultsText = '';
        if (totalVotes > 0) {
            results.forEach((result, index) => {
                const percentage = ((result.votes / totalVotes) * 100).toFixed(1);
                const barLength = Math.round((result.votes / Math.max(...results.map(r => r.votes))) * 10);
                const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
                
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                resultsText += `${medal} ${result.emoji} **${result.option}**\n`;
                resultsText += `${bar} ${result.votes} votes (${percentage}%)\n\n`;
            });
        } else {
            resultsText = 'No votes have been cast yet.';
        }
        
        const embed = {
            title: isEnding ? '📊 Final Poll Results' : '📊 Current Poll Results',
            description: `**${pollData.question}**`,
            color: isEnding ? 0x00ff00 : 0x4834d4,
            fields: [
                {
                    name: '📈 Results',
                    value: resultsText,
                    inline: false
                }
            ],
            footer: {
                text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀'
            },
            timestamp: new Date().toISOString()
        };
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        
    } catch (error) {
        console.error('Error showing poll results:', error);
        await interaction.reply({ content: '❌ An error occurred while fetching poll results.', ephemeral: true });
    }
}

// Function to end poll from button interaction
async function endPollFromButton(interaction, pollData, messageId) {
    try {
        const message = await interaction.channel.messages.fetch(messageId);
        const reactions = message.reactions.cache;
        let totalVotes = 0;
        const results = [];
        
        if (pollData.options.length > 0) {
            // Custom options poll
            for (let i = 0; i < pollData.options.length; i++) {
                const reaction = reactions.get(pollData.numberEmojis[i]);
                const count = reaction ? reaction.count - 1 : 0; // Subtract bot's reaction
                results.push({ option: pollData.options[i], votes: count, emoji: pollData.numberEmojis[i] });
                totalVotes += count;
            }
        } else {
            // Yes/No poll
            const yesReaction = reactions.get('✅');
            const noReaction = reactions.get('❌');
            const yesVotes = yesReaction ? yesReaction.count - 1 : 0;
            const noVotes = noReaction ? noReaction.count - 1 : 0;
            
            results.push({ option: 'Yes', votes: yesVotes, emoji: '✅' });
            results.push({ option: 'No', votes: noVotes, emoji: '❌' });
            totalVotes = yesVotes + noVotes;
        }
        
        // Sort results by vote count
        results.sort((a, b) => b.votes - a.votes);
        
        // Create final results embed
        const creator = await interaction.client.users.fetch(pollData.creator);
        
        const resultsEmbed = new EmbedBuilder()
            .setTitle('📊 Poll Results')
            .setDescription(`**${pollData.question}**`)
            .setColor('#00ff00')
            .setAuthor({ 
                name: pollData.isAnonymous ? 'Anonymous Poll' : creator.tag, 
                iconURL: pollData.isAnonymous ? interaction.guild.iconURL({ dynamic: true }) : creator.displayAvatarURL({ dynamic: true }) 
            })
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        if (totalVotes > 0) {
            let resultsText = '';
            results.forEach((result, index) => {
                const percentage = ((result.votes / totalVotes) * 100).toFixed(1);
                const barLength = Math.round((result.votes / Math.max(...results.map(r => r.votes))) * 10);
                const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
                
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                resultsText += `${medal} ${result.emoji} **${result.option}**\n`;
                resultsText += `${bar} ${result.votes} votes (${percentage}%)\n\n`;
            });
            
            resultsEmbed.addFields({ name: '📈 Results', value: resultsText, inline: false });
        } else {
            resultsEmbed.addFields({ name: '📈 Results', value: 'No votes were cast.', inline: false });
        }
        
        // Update the message with results and remove components
        await message.edit({ embeds: [resultsEmbed], components: [] });
        
        // Remove poll data from memory
        if (interaction.client.polls) {
            interaction.client.polls.delete(messageId);
        }
        
        await interaction.reply({ content: '✅ Poll has been ended successfully!', ephemeral: true });
        
    } catch (error) {
        console.error('Error ending poll:', error);
        await interaction.reply({ content: '❌ An error occurred while ending the poll.', ephemeral: true });
    }
}

// Staff Application Helper Functions
function getModalTitle(language) {
    switch (language) {
        case 'arabic':
            return 'طلب انضمام للطاقم';
        case 'english':
            return 'Staff Application';
        case 'darija':
            return 'طلب باش تولي ستاف';
        case 'tamazight':
            return 'ⴰⵙⵓⵜⵔ ⵏ ⵓⵙⴽⵛⵎ ⵉ staff';
        default:
            return 'Staff Application';
    }
}

function getQuestions(language) {
    switch (language) {
        case 'arabic':
            return [
                'ما هو اسمك على ديسكورد (Username + Tag)؟',
                'كم عمرك؟',
                'من أي بلد أنت؟',
                'كم من الوقت تقضي على ديسكورد يوميًا؟',
                'هل سبق وتم طردك أو حظرك من أي سيرفر؟ إذا نعم، لماذا؟',
                'هل سبق وبلغ عنك أحد بسبب إساءة أو مخالفة؟',
                'ما هي المدة التي تتوقع البقاء فيها كستاف إذا تم قبولك؟',
                'هل تستطيع الالتزام بالرد على الرسائل أو البلاغات في وقت قصير؟',
                'هل لديك أصدقاء أو معارف في السيرفر حاليًا؟',
                'إذا تم منحك الصلاحيات، هل توافق على أنه سيتم سحبها فورًا إذا فقدنا الثقة بك بدون نقاش؟'
            ];
        case 'english':
            return [
                'What is your Discord username (Username + Tag)?',
                'How old are you?',
                'Which country are you from?',
                'How many hours per day do you spend on Discord?',
                'Have you ever been kicked or banned from any server? If yes, why?',
                'Has anyone ever reported you for misconduct or rule-breaking?',
                'How long do you plan to stay as a staff member if accepted?',
                'Can you commit to responding to messages or reports quickly?',
                'Do you currently have any friends or acquaintances in this server?',
                'If given staff permissions, do you agree that they can be removed at any time if we lose trust in you, without discussion?'
            ];
        case 'darija':
            return [
                'شنو هو الاسم ديالك فديسكورد (Username + Tag)؟',
                'شحال فعمرك؟',
                'منين نتا؟',
                'شحال من الوقت كتقضي فديسكورد كل نهار؟',
                'واش سبق وطردوك ولا حظروك من شي سيرفر؟ إيلا آه، علاش؟',
                'واش سبق وشي واحد بلغ عليك حيت دريتي شي حاجة خايبة؟',
                'شحال من الوقت كتخطط تبقا ستاف إيلا قبلوك؟',
                'واش تقدر تلتزم باش ترد على الرسائل والبلاغات بزربة؟',
                'واش عندك شي صحاب ولا ناس تعرفهم فهاد السيرفر دابا؟',
                'إيلا عطاوك صلاحيات الستاف، واش موافق أنهم يقدرو يحيدوها منك أي وقت إيلا خسرو الثقة فيك، بلا نقاش؟'
            ];
        case 'tamazight':
            return [
                'ⵎⴰ ⵉⵙⵎⵉⵇ ⵉⴽ ⵖⴼ Discord (Username + Tag) ?',
                'ⵜⵣⵔⵉⵖ ⵎⴰⵛⵛⵉ ⵜⴰⵣⵡⴰⵔⵜⵉⴽ ?',
                'ⵙ ⴰⵎⴰⵏⵉ ⵜⵜⴷⴷⵓⴷ ?',
                'ⵙ ⴰⵛⵎⵉ ⵢⵉⴷⵔⴰⵏ ⵜⴻⵙⵙⴰⴷⴷ ⴷ ⵖⴼ Discord ⴷⴳ ⵡⴰⵙ ?',
                'ⵉⴹⴻⵍⵍⵉ ⵢⴻⵍⵍⴰ ⵢⵉⵡⴻⵏ ⵢⴻⵜⵜⴰⴹⴰⵔⴽ ⵏⴻⵏⵖ ⵢⴻⵃⴻⴹⴽ ⵙⴻⴳ ⵢⵉⵙⴻⵎ ⵏ ⵉⵡⴻⵔⵎⴰⴹ ? ⵎⴰ ⵉⵀ, ⵎⴻⵍ ⴷ ⴰⵢⵖⴻⵔ.',
                'ⵢⴻⵍⵍⴰ ⵢⵉⵡⴻⵏ ⵢⴻⵔⵏⴰ ⵉⵃⴻⴹ ⴼⴻⵍⵍⴰⴽ ⵉ ⵜⵖⴰⵔⴰ ⵏ ⵉⵜⵓⵇⵇⵏⴰ ⴻⵏⵖ ⵉ ⵜⵓⵇⵇⵏⴰ ⵏ ⴰⵚⴻⵔⴽⴰⵏ ?',
                'ⵎⴰⵟⵟⵉ ⴰⵔⴰ ⵜⴰⵣⵡⴰⵔⵜⵉⴽ ⵉ ⵜⴻⴱⵖⵉⴷ ⴰⴷ ⵜⴻⵇⵇⵉⵎⴷ ⴷ staff ⵎⴰ ⵜⵜⵡⴰⵇⴱⴻⵍⵉⴽ ?',
                'ⵜⵣⴻⵎⵔⴻⴷ ⴰⴷ ⵜⴻⵔⵔ ⴷ ⵜⵉⵔⵉⵔⵉⵜ ⵖⴻⵔ ⵢⴻⵣⵏⴰⵏ ⴻⵏⵖ ⵜⵉⵍⵖⴰⵔⵉⵏ ⵙ ⵣⵣⵎⴰⵏ ?',
                'ⵜⴻⵍⵍⴰⴽ ⵜⵓⵔⴰ ⴷ ⵉⵎⴻⵜⵜⵉ ⵏⴻⵏⵖ ⵉⵡⴻⵏⵏⵉⵜ ⵉ ⵜⵙⵙⴻⵏⴻⴷ ⴷⴳ ⵢⵉⵙⴻⵎ ⴰⴳⵉ ?',
                'ⵎⴰ ⵜⵜⵡⴰⴼⴽⴻⴷ ⵉ ⵢⵉⵣⴻⵔⴼⴰⵏ ⵏ staff, ⵜⵇⵇⵉⵎⴻⴷ ⵉ ⵜⵜⵉⵖⴻⵔ ⴰⴷ ⵜⵜⵟⵟⴻⵃⴻⴹ ⴷ ⵉⵎⴰⵏⵏ ⵎⴰ ⵢⴻⵜⵜⵡⴰⵃⴻⵔ ⵙ ⵓⵎⴰⵢⵏ ⵖⴻⴼⴽ, ⵡⴰⵔ ⴰⵡⴰⵍ ?'
            ];
        default:
            return [];
    }
}

async function processApplication(interaction, language, answers, questions) {
    try {
        // Create application embed
        const applicationEmbed = new EmbedBuilder()
            .setTitle('📋 New Staff Application')
            .setDescription(`**Applicant:** ${interaction.user} (${interaction.user.tag})\n**Language:** ${getLanguageDisplay(language)}\n**Applied:** <t:${Math.floor(Date.now() / 1000)}:F>`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor('#FFD700')
            .setFooter({ text: `User ID: ${interaction.user.id}` })
            .setTimestamp();

        // Add questions and answers as fields
        for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
            const question = questions[i].length > 256 ? questions[i].substring(0, 253) + '...' : questions[i];
            const answer = answers[i].length > 1024 ? answers[i].substring(0, 1021) + '...' : answers[i];
            
            applicationEmbed.addFields({
                name: `${i + 1}. ${question}`,
                value: answer,
                inline: false
            });
        }

        // Send to submission channel
        const submissionChannel = interaction.client.channels.cache.get('1409971599377039370');
        if (submissionChannel) {
            await submissionChannel.send({ embeds: [applicationEmbed] });
        }

        // Send confirmation to user
        const confirmationMessage = getConfirmationMessage(language);
        try {
            await interaction.reply({ 
                content: confirmationMessage, 
                ephemeral: true 
            });
        } catch (replyError) {
            // Handle expired interaction gracefully
            if (replyError.code === 10062) {
                console.log('Interaction expired - application was processed successfully but user notification failed');
            } else {
                console.error('Error sending confirmation:', replyError);
            }
        }

    } catch (error) {
        console.error('Error processing application:', error);
        
        // Handle expired interaction (Unknown interaction error)
        if (error.code === 10062) {
            console.log('Interaction expired - application was processed but user notification failed');
            return; // Don't try to reply to expired interaction
        }
        
        try {
            await interaction.reply({ 
                content: 'There was an error processing your application. Please try again later.', 
                ephemeral: true 
            });
        } catch (replyError) {
            console.error('Failed to send error reply:', replyError);
        }
    }
}

function getLanguageDisplay(language) {
    switch (language) {
        case 'arabic':
            return '🇸🇦 العربية';
        case 'english':
            return '🇺🇸 English';
        case 'darija':
            return '🇲🇦 الدارجة المغربية';
        case 'tamazight':
            return '<:tamazight:1328392111963504771> ⵜⴰⵎⴰⵣⵉⵖⵜ';
        default:
            return 'Unknown';
    }
}

function getConfirmationMessage(language) {
    switch (language) {
        case 'arabic':
            return '✅ **تم إرسال طلبك بنجاح!**\n\nشكرًا لك على التقديم لفريق الطاقم. تم إرسال إجاباتك إلى الإدارة وسيتم مراجعتها قريبًا.\n\n**ماذا بعد؟**\n• انتظر الرد من الإدارة\n• ستحصل على الموافقة أو الرفض عبر الرسائل الخاصة\n• يرجى التحلي بالصبر أثناء عملية المراجعة\n\nحظًا موفقًا! 🍀';
        case 'english':
            return '✅ **Your application has been sent successfully!**\n\nThank you for applying to our staff team. Your answers have been submitted to the administration and will be reviewed soon.\n\n**What\'s next?**\n• Wait for a response from the administration\n• You will receive approval or decline via DM\n• Please be patient during the review process\n\nGood luck! 🍀';
        case 'darija':
            return '✅ **تم إرسال الطلب ديالك بنجاح!**\n\nشكرا ليك على التقديم لفريق الستاف. الأجوبة ديالك تبعثو للإدارة وغادي يراجعوها قريب.\n\n**شنو غادي يوقع دابا؟**\n• تسنا الجواب من الإدارة\n• غادي توصلك الموافقة ولا الرفض فالرسائل الخاصة\n• خاصك تصبر شوية باش يراجعو الطلب\n\nبالتوفيق! 🍀';
        case 'tamazight':
            return '✅ **ⴰⵙⵓⵜⵔ ⵏⵏⴽ ⵢⵓⵣⴰⵏ ⵙ ⵜⵎⴰⵎⴽⵜ!**\n\nⵜⴰⵏⵎⵎⵉⵔⵜ ⵅⴼ ⵓⵙⵓⵜⵔ ⵏ ⵓⵙⵔⴰⴳ. ⵜⵉⵔⴰⵔⵉⵏ ⵏⵏⴽ ⵜⵜⵓⵣⴰⵏⵉⵏ ⵉ ⵓⵙⵇⵇⵉⵎ ⴰⴷ ⵜⵏ ⵉⵙⵙⴽⵔ.\n\n**ⵎⴰⵏ ⴰⴷ ⵉⵍⵉⵏ?**\n• ⵔⴰⵊⵓ ⵜⵉⵔⴰⵔⵉⵏ ⵙⴳ ⵓⵙⵇⵇⵉⵎ\n• ⴰⴷ ⵜⴰⵡⵉⴷ ⴰⵇⴱⵓⵍ ⵏⵖ ⴰⴳⵢ ⵙ ⵜⵉⵔⴰⵔⵉⵏ ⵜⵓⵙⵙⵉⵏⵉⵏ\n• ⵉⵅⵚⵚⴰ ⴰⴷ ⵜⵙⴱⵔⴷ ⴰⵔ ⴰⴷ ⵜⵏ ⵉⵙⵙⴽⵔ\n\nⵙ ⵜⴼⵍⵓⴽⵜ! 🍀';
        default:
            return '✅ **Your application has been sent successfully!**\n\nThank you for applying to our staff team. Your answers have been submitted to the administration and will be reviewed soon.';
    }
}

// Help menu interaction handlers
async function handleHelpInteraction(interaction) {
    const { customId } = interaction;
    
    if (customId === 'help_refresh') {
        // Refresh the main menu
        const mainEmbed = createMainHelpEmbed(interaction);
        const components = createHelpComponents();
        
        await interaction.update({ 
            embeds: [mainEmbed], 
            components: components 
        });
        return;
    }
    
    if (customId === 'help_all_commands') {
        const allCommandsEmbed = createAllCommandsEmbed();
        await interaction.reply({ embeds: [allCommandsEmbed], ephemeral: true });
        return;
    }
    
    // Handle category buttons
    const category = customId.replace('help_', '');
    const categoryEmbed = createCategoryEmbed(category);
    await interaction.reply({ embeds: [categoryEmbed], ephemeral: true });
}

async function handleHelpCategorySelect(interaction) {
    const selectedCategory = interaction.values[0];
    const categoryEmbed = createCategoryEmbed(selectedCategory);
    await interaction.reply({ embeds: [categoryEmbed], ephemeral: true });
}

function createMainHelpEmbed(interaction) {
    return new EmbedBuilder()
        .setTitle('🤖 WisdomJebril V3 - Interactive Command Menu')
        .setDescription('Welcome to the advanced command center! Choose a category below to explore commands.')
        .setColor('#2F3136')
        .addFields(
            {
                name: '📋 Quick Stats',
                value: `\`\`\`\n📊 Total Commands: 50+\n🎯 Categories: 8\n⚡ Response Time: <1s\n🔧 Version: 3.0.0\`\`\``,
                inline: true
            },
            {
                name: '🚀 Getting Started',
                value: '• Use the dropdown menu below\n• Click category buttons for quick access\n• All commands use `!` prefix\n• Admin commands require permissions',
                inline: true
            },
            {
                name: '💡 Pro Tips',
                value: '• Use `!help [command]` for detailed info\n• Commands are case-insensitive\n• Some commands have aliases\n• Check permissions before using',
                inline: false
            }
        )
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
        .setTimestamp();
}

function createHelpComponents() {
    const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('🔍 Select a command category to explore...')
        .addOptions([
            {
                label: 'Moderation Commands',
                description: 'Ban, kick, mute, timeout and more moderation tools',
                value: 'moderation',
                emoji: '👮'
            },
            {
                label: 'Management Commands',
                description: 'Server management, roles, channels and utilities',
                value: 'management',
                emoji: '🔧'
            },
            {
                label: 'Information Commands',
                description: 'User info, server stats, and data retrieval',
                value: 'information',
                emoji: '📊'
            },
            {
                label: 'Voice Commands',
                description: 'Voice channel management and controls',
                value: 'voice',
                emoji: '🎵'
            },
            {
                label: 'Birthday System',
                description: 'Birthday reminders and celebration features',
                value: 'birthday',
                emoji: '🎂'
            },
            {
                label: 'Report System',
                description: 'User reporting and moderation queue',
                value: 'report',
                emoji: '📝'
            },
            {
                label: 'Special Commands',
                description: 'Advanced features and admin utilities',
                value: 'special',
                emoji: '⚡'
            },
            {
                label: 'Help & Support',
                description: 'Documentation and assistance commands',
                value: 'help_support',
                emoji: '📚'
            }
        ]);

    const quickButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help_moderation')
                .setLabel('Moderation')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👮'),
            new ButtonBuilder()
                .setCustomId('help_management')
                .setLabel('Management')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔧'),
            new ButtonBuilder()
                .setCustomId('help_birthday')
                .setLabel('Birthdays')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎂'),
            new ButtonBuilder()
                .setCustomId('help_all_commands')
                .setLabel('All Commands')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('📋')
        );

    const navButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help_refresh')
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setLabel('Support')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/your-support-server')
                .setEmoji('🆘'),
            new ButtonBuilder()
                .setLabel('Invite Bot')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot')
                .setEmoji('➕')
        );

    const selectRow = new ActionRowBuilder().addComponents(categorySelect);
    return [selectRow, quickButtons, navButtons];
}

function createCategoryEmbed(category) {
    const commandData = {
        moderation: {
            title: '👮 Moderation Commands',
            description: 'Powerful tools to maintain order and discipline in your server.',
            color: '#FF6B6B',
            commands: [
                { name: '!ban', description: 'Ban a user from the server', usage: '!ban @user [reason]', permissions: 'Ban Members' },
                { name: '!kick', description: 'Kick a user from the server', usage: '!kick @user [reason]', permissions: 'Kick Members' },
                { name: '!mute', description: 'Mute a user in voice channels', usage: '!mute @user', permissions: 'Mute Members' },
                { name: '!unmute', description: 'Unmute a user in voice channels', usage: '!unmute @user', permissions: 'Mute Members' },
                { name: '!warn', description: 'Issue a warning to a user', usage: '!warn @user [reason]', permissions: 'Moderate Members' },
                { name: '!timeout', description: 'Timeout a user for specified duration', usage: '!timeout @user [duration] [reason]', permissions: 'Moderate Members' },
                { name: '!unban', description: 'Unban a previously banned user', usage: '!unban [user_id]', permissions: 'Ban Members' },
                { name: '!deafen', description: 'Deafen a user in voice channels', usage: '!deafen @user', permissions: 'Deafen Members' },
                { name: '!undeafen', description: 'Undeafen a user in voice channels', usage: '!undeafen @user', permissions: 'Deafen Members' },
                { name: '!muteall', description: 'Mute all users in a voice channel', usage: '!muteall', permissions: 'Mute Members' },
                { name: '!unmuteall', description: 'Unmute all users in a voice channel', usage: '!unmuteall', permissions: 'Mute Members' }
            ]
        },
        management: {
            title: '🔧 Management Commands',
            description: 'Essential tools for server administration and configuration.',
            color: '#4ECDC4',
            commands: [
                { name: '!say', description: 'Make the bot say something', usage: '!say [message]', permissions: 'Manage Messages' },
                { name: '!lock', description: 'Lock a channel to prevent messages', usage: '!lock [#channel]', permissions: 'Manage Channels' },
                { name: '!unlock', description: 'Unlock a previously locked channel', usage: '!unlock [#channel]', permissions: 'Manage Channels' },
                { name: '!slowmode', description: 'Set slowmode for a channel', usage: '!slowmode [seconds]', permissions: 'Manage Channels' },
                { name: '!clear', description: 'Delete multiple messages at once', usage: '!clear [amount]', permissions: 'Manage Messages' },
                { name: '!role', description: 'Manage user roles', usage: '!role @user [role]', permissions: 'Manage Roles' },
                { name: '!nickname', description: 'Change a user\'s nickname', usage: '!nickname @user [new_nick]', permissions: 'Manage Nicknames' },
                { name: '!nuke', description: 'Clone and delete a channel', usage: '!nuke', permissions: 'Manage Channels' }
            ]
        },
        information: {
            title: '📊 Information Commands',
            description: 'Retrieve detailed information about users, server, and statistics.',
            color: '#45B7D1',
            commands: [
                { name: '!userinfo', description: 'Get detailed information about a user', usage: '!userinfo [@user]', permissions: 'None' },
                { name: '!server', description: 'Display server information and statistics', usage: '!server', permissions: 'None' },
                { name: '!admins', description: 'List all server administrators', usage: '!admins', permissions: 'None' },
                { name: '!banlist', description: 'Show list of banned users', usage: '!banlist', permissions: 'Ban Members' },
                { name: '!showwarnings', description: 'Display user warnings', usage: '!showwarnings [@user]', permissions: 'Moderate Members' },
                { name: '!ping', description: 'Check bot latency and response time', usage: '!ping', permissions: 'None' },
                { name: '!avatar', description: 'Display user\'s avatar', usage: '!avatar [@user]', permissions: 'None' },
                 { name: '!banner', description: 'Display user\'s banner', usage: '!banner [@user]', permissions: 'None' },
                 { name: '!tsara', description: 'Check if a user is in a voice channel', usage: '!tsara @user', permissions: 'None' }
            ]
        },
        voice: {
            title: '🎵 Voice Commands',
            description: 'Manage voice channels and control user voice states.',
            color: '#9B59B6',
            commands: [
                { name: '!move', description: 'Move a user to another voice channel', usage: '!move @user [channel]', permissions: 'Move Members' },
                { name: '!moveall', description: 'Move all users from one channel to another', usage: '!moveall [from_channel] [to_channel]', permissions: 'Move Members' },
                { name: '!disconnect', description: 'Disconnect a user from voice channel', usage: '!disconnect @user', permissions: 'Move Members' },
                { name: '!disconnectall', description: 'Disconnect all users from voice channel', usage: '!disconnectall', permissions: 'Move Members' }
            ]
        },
        birthday: {
            title: '🎂 Birthday System',
            description: 'Celebrate birthdays with automated reminders and announcements.',
            color: '#F39C12',
            commands: [
                { name: '!setupbirthdays', description: 'Set up birthday system for the server', usage: '!setupbirthdays', permissions: 'Administrator' },
                { name: '!addbirthday', description: 'Add your birthday to the system', usage: '!addbirthday [DD/MM]', permissions: 'None' },
                { name: '!birthdays', description: 'View all registered birthdays', usage: '!birthdays', permissions: 'None' },
                { name: '!removebirthday', description: 'Remove your birthday from the system', usage: '!removebirthday', permissions: 'None' }
            ]
        },
        report: {
            title: '📝 Report System',
            description: 'User reporting system for community moderation.',
            color: '#E74C3C',
            commands: [
                { name: '!report', description: 'Report a user for misconduct', usage: '!report @user [reason]', permissions: 'None' },
                { name: '!reportlist', description: 'View pending reports', usage: '!reportlist', permissions: 'Moderate Members' },
                { name: '!reportclean', description: 'Clear resolved reports', usage: '!reportclean', permissions: 'Administrator' },
                { name: '!reporthelp', description: 'Get help with the report system', usage: '!reporthelp', permissions: 'None' }
            ]
        },
        special: {
            title: '⚡ Special Commands',
            description: 'Advanced features and specialized administrative tools.',
            color: '#8E44AD',
            commands: [
                { name: '!tracktimer', description: 'Track time for activities', usage: '!tracktimer [activity]', permissions: 'None' },
                { name: '!reject', description: 'Add user to reject list', usage: '!reject @user', permissions: 'Administrator' },
                { name: '!unreject', description: 'Remove user from reject list', usage: '!unreject @user', permissions: 'Administrator' },
                { name: '!antispam', description: 'Configure anti-spam settings', usage: '!antispam [on/off]', permissions: 'Administrator' },
                { name: '!removewarn', description: 'Remove warnings from a user', usage: '!removewarn @user [amount]', permissions: 'Administrator' },
                { name: '!giveaway', description: 'Create and manage giveaways', usage: '!giveaway [prize] [duration]', permissions: 'Manage Messages' },
                { name: '!poll', description: 'Create interactive polls', usage: '!poll [question] [options]', permissions: 'None' }
            ]
        },
        help_support: {
            title: '📚 Help & Support',
            description: 'Documentation, guides, and assistance commands.',
            color: '#27AE60',
            commands: [
                { name: '!help', description: 'Display this interactive help menu', usage: '!help [command]', permissions: 'None' },
                { name: '!lmohim', description: 'Show important server commands', usage: '!lmohim', permissions: 'None' },
                { name: '!warninghelp', description: 'Get help with the warning system', usage: '!warninghelp', permissions: 'None' },
                { name: '!reporthelp', description: 'Get help with the report system', usage: '!reporthelp', permissions: 'None' }
            ]
        }
    };
    
    const data = commandData[category];
    if (!data) {
        return new EmbedBuilder()
            .setTitle('❌ Category Not Found')
            .setDescription('The requested command category could not be found.')
            .setColor('#E74C3C');
    }
    
    const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setDescription(data.description)
        .setColor(data.color)
        .setTimestamp()
        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' });
    
    // Add commands in chunks to avoid embed limits
    const commandChunks = [];
    for (let i = 0; i < data.commands.length; i += 3) {
        commandChunks.push(data.commands.slice(i, i + 3));
    }
    
    commandChunks.forEach((chunk, index) => {
        const fieldValue = chunk.map(cmd => 
            `**${cmd.name}**\n${cmd.description}\n\`Usage:\` ${cmd.usage}\n\`Permissions:\` ${cmd.permissions}\n`
        ).join('\n');
        
        embed.addFields({
            name: index === 0 ? '📋 Commands' : '\u200b',
            value: fieldValue,
            inline: false
        });
    });
    
    return embed;
}

function createAllCommandsEmbed() {
    return new EmbedBuilder()
        .setTitle('📋 All Commands - Quick Reference')
        .setDescription('Complete list of all available commands organized by category.')
        .setColor('#2F3136')
        .addFields(
            {
                name: '👮 Moderation (11)',
                value: '`!ban` `!kick` `!mute` `!unmute` `!warn` `!timeout` `!unban` `!deafen` `!undeafen` `!muteall` `!unmuteall`',
                inline: false
            },
            {
                name: '🔧 Management (8)',
                value: '`!say` `!lock` `!unlock` `!slowmode` `!clear` `!role` `!nickname` `!nuke`',
                inline: false
            },
            {
                name: '📊 Information (9)',
                value: '`!userinfo` `!server` `!admins` `!banlist` `!showwarnings` `!ping` `!avatar` `!banner` `!tsara`',
                inline: false
            },
            {
                name: '🎵 Voice (4)',
                value: '`!move` `!moveall` `!disconnect` `!disconnectall`',
                inline: false
            },
            {
                name: '🎂 Birthday System (4)',
                value: '`!setupbirthdays` `!addbirthday` `!birthdays` `!removebirthday`',
                inline: false
            },
            {
                name: '📝 Report System (4)',
                value: '`!report` `!reportlist` `!reportclean` `!reporthelp`',
                inline: false
            },
            {
                name: '⚡ Special Commands (7)',
                value: '`!tracktimer` `!reject` `!unreject` `!antispam` `!removewarn` `!giveaway` `!poll`',
                inline: false
            },
            {
                name: '📚 Help & Support (4)',
                value: '`!help` `!lmohim` `!warninghelp` `!reporthelp`',
                inline: false
            },
            {
                name: '💡 Usage Tips',
                value: '• Use `!help [category]` for detailed command info\n• All commands require appropriate permissions\n• Commands are case-insensitive\n• Some commands have aliases for convenience',
                inline: false
            }
        )
        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
        .setTimestamp();
}
