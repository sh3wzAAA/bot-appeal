const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu, MessageAttachment } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
let isApplicationOpen = false;
const karizma = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
    partials: ["CHANNEL"]
});
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

const { botToken } = require('./data/config');

const commands = [
    {
        name: 'send_embed',
        description: 'ارسال ايمبد فارغة'
    },
    {
        name: 'openapp',
        description: 'فتح التقديم'
    },
    {
        name: 'closeapp',
        description: 'غلق التقديم'
    },
];

const rest = new REST({ version: '9' }).setToken(botToken);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands("1302486096499970129", "1279315793120854016"),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error while refreshing application (/) commands:', error);
    }
})();

karizma.on('ready', () => {
    console.log("Ready.");
});

karizma.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'send_embed') {
        if (interaction.user.id !== '1265245971961352314') {
            return interaction.reply({ content: 'هذا الامر متاح فقط للمطور - <@1265245971961352314>', ephemeral: true });
        }

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('فتح تذكرة جديدة')
            .setDescription('إذا كنت ترغب في فتح تذكرة ، انقر فوق في الجزء السفلي من هذه الرسالة\n\nتأكد من تقديم جميع المعلومات المتعلقة بوضعك وإلا فسيتم إغلاق تذكرتك على الفور بسبب نقص التفاصيل\n\nيرجي اختيار القسم صحيح غير ذلك يتم اغلاق التذكرة\n\nعدم كتابة الموضوع او ترك التذكرة وعدم الرد خلال 48 ساعة يتم اغلاق التذكرة تلقائيا')
            .setFooter('نظام التذاكر | Klebitz', interaction.guild.iconURL({ dynamic: true, size: 64 }))
            .setTimestamp();

        const button = new MessageButton()
            .setCustomId('createMyEmbedEP') // معرف الزر
            .setLabel('📩 فتح تذكرة جديدة') // استخدام الإيموجي مباشرة
            .setStyle('SUCCESS');

        const row = new MessageActionRow().addComponents(button);

        const channel = interaction.channel;
        const message = await channel.send({ embeds: [embed], components: [row] });

        interaction.reply({ content: 'تم إرسال الرسالة بنجاح ✅', ephemeral: true });   
    } else if (commandName === 'openapp') {
        isApplicationOpen = true; // فتح التقديم
        interaction.reply({ content: '📢✅ تم فتح التقديم الي العائلة بنجاح', ephemeral: true});
    } else if (commandName === 'closeapp') {
        isApplicationOpen = false; // غلق التقديم
        interaction.reply({ content: '🚫✅ تم اغلاق التقديم الي العائلة بنجاح', ephemeral: true});
    }
});

karizma.on('interactionCreate', async (interaction) => {
    if (!interaction.isSelectMenu()) return;

    if (interaction.customId === 'ticketSelect') {
        const selectedOption = interaction.values[0]; // الحصول على القيمة التي اختارها المستخدم

        if (selectedOption === 'openTicketApplication') {
            const ticketChannelName = `ticket-${interaction.user.username.replace(/\W/g, '')}`;
            const existingChannel = interaction.guild.channels.cache.find(channel => channel.name === ticketChannelName);
            if (existingChannel) {
                return interaction.reply({ content: 'لقد قمت بفتح تذكرة مسبقًا ولا يمكنك فتح تذكرة جديدة.', ephemeral: true });
            }
            
            if (!isApplicationOpen) {
                const closedEmbed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle('🚫 التقديم مغلق الآن')
                .setDescription('التقديم مغلق حاليًا، يمكنك المحاولة في وقت لاحق عندما يصبح التقديم مفتوحًا.')
                .setTimestamp();

                return await interaction.reply({ embeds: [closedEmbed], ephemeral: true });
            }

            const modal = new Modal()
                .setCustomId('ticketModal')
                .setTitle('تقديم الي العائلة')
                .addComponents(
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('accountName')
                            .setLabel('اسم حسابك:')
                            .setRequired(true)
                            .setStyle('SHORT')
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('username')
                            .setLabel('اسمك داخل الخادم:')
                            .setRequired(true)
                            .setStyle('SHORT')
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('hours')
                            .setLabel('عدد ساعاتك:')
                            .setRequired(true)
                            .setStyle('SHORT')
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('level')
                            .setLabel('لفلك الحالي:')
                            .setRequired(true)
                            .setStyle('SHORT')
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId('agreement')
                            .setLabel('هل توافق أن تكون فرداً من العائلة؟ (نعم/لا):')
                            .setRequired(true)
                            .setStyle('SHORT')
                    )
                );
    
            await interaction.showModal(modal);
        } else if (selectedOption === 'openTicketSupport') {
            const ticketChannelName = `owners-${interaction.user.username.replace(/\W/g, '')}`;
            const existingChannel = interaction.guild.channels.cache.find(channel => channel.name === ticketChannelName);
            if (existingChannel) {
                return interaction.reply({ content: 'لقد قمت بفتح تذكرة مسبقًا ولا يمكنك فتح تذكرة جديدة.', ephemeral: true });
            }

            const modal = new Modal()
            .setCustomId('ticketMasoleen')
            .setTitle('تواصل مع المسؤولين')
            .addComponents(
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId('accountName')
                        .setLabel('اسم حسابك:')
                        .setRequired(true)
                        .setStyle('SHORT')
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId('username')
                        .setLabel('اسمك داخل الخادم:')
                        .setRequired(true)
                        .setStyle('SHORT')
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId('reason')
                        .setLabel('سبب فتح التذكرة')
                        .setRequired(true)
                        .setStyle('SHORT')
                ),
            );

        await interaction.showModal(modal);
        } else if (selectedOption === 'openTicketT7alf') {
            await interaction.reply({ content: 'احنا عيلة معادية يا اهبل 🖕🏿😂', ephemeral: true });

            const channel = interaction.guild.channels.cache.get('1303918613585072260');
            if (channel) {
                await channel.send(`الاهبل <@${interaction.user.id}> حاول يفتح تكت طلب تحالف واتخزوق :joy:\n@everyone`);
            } else {
                console.error('القناة غير موجودة!');
            }
        }
    }
});


const ticketClaimedBy = new Map();
karizma.on('interactionCreate', async (interaction) => {
    if  (interaction.customId === 'createMyEmbedEP') {
        const embed = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle('فتح تذكرة جديدة')
            .setImage('https://cdn.discordapp.com/attachments/1295027594366029894/1302494274356645919/New_Project_60.png?ex=672c4652&is=672af4d2&hm=fbd7ffac79e3e73938c61e5ca66f6139d726740b1f5dfc2fb3d40d93d93dd700&')
            .setDescription('إذا كنت ترغب في فتح تذكرة ، انقر فوق في الجزء السفلي من هذه الرسالة.\nتأكد من تقديم جميع المعلومات المتعلقة بوضعك وإلا فسيتم إغلاق تذكرتك على الفور بسبب نقص التفاصيل.\nسنصل إليك في غضون 12-24 ساعة. لا تقم باختبار اتصال الموظفين ، فلن يؤدي ذلك إلى تسريع العملية!')
            .setFooter('نظام التذاكر | Klebitz', interaction.guild.iconURL({ dynamic: true, size: 64 }))
            .setTimestamp();

        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('ticketSelect')
                .setPlaceholder('اختيار نوع التذكرة')
                .addOptions([
                    {
                        label: 'فتح تذكرة تقديم',
                        value: 'openTicketApplication',
                        description: 'فتح تذكرة لتقديم طلب جديد',
                        emoji: '📑'
                    },
                    {
                        label: 'فتح تذكرة تواصل مع المسؤولين',
                        value: 'openTicketSupport',
                        description: 'فتح تذكرة للتواصل مع المسؤولين',
                        emoji: '👥'
                    },
                    {
                        label: 'فتح تذكرة تحالف',
                        value: 'openTicketT7alf',
                        description: 'فتح تذكرة لطلب التحالف',
                        emoji: '🤝'
                    },
                ])
        );
        await interaction.reply({embeds: [embed],  components: [row], ephemeral: true});
    }

    if (interaction.customId === 'ticketMasoleen') {
        const accountName = interaction.fields.getTextInputValue('accountName');
        const username = interaction.fields.getTextInputValue('username');
        const reason = interaction.fields.getTextInputValue('reason');
        const ticketChannelName = `owners-${interaction.user.username.replace(/\W/g, '')}`;

        try {
            const ticketChannel = await interaction.guild.channels.create(ticketChannelName, {
                type: 'text',
                parent: '1303048782547779676',
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: interaction.user.id,
                        allow: ['VIEW_CHANNEL'],
                    },
                ],
            });
        
            // إنشاء Embed مع إيموجيات وتحسينات
            const embed = new MessageEmbed()
                .setColor('#0099ff') // اللون الأزرق
                .setTitle('📝 معلومات التذكرة')
                .addFields(
                    { name: '👤 اسم حسابك', value: accountName, inline: false },
                    { name: '🧑‍💻 اسمك داخل الخادم', value: username, inline: false },
                    { name: '⏱️ سبب فتح التذكرة', value: reason, inline: false },
                )
                .setFooter('نظام التذاكر | Klebitz', interaction.guild.iconURL({ dynamic: true, size: 64 }))
                .setTimestamp();
        
            // إنشاء الأزرار (Button)
            const claimButton = new MessageButton()
                .setCustomId('claimTicket')
                .setLabel('👑 استلام التذكرة')
                .setStyle('SUCCESS');
        
            const closeButton = new MessageButton()
                .setCustomId('closeTicket')
                .setLabel('🔒 إغلاق التذكرة')
                .setStyle('DANGER');
        
            const row = new MessageActionRow().addComponents(claimButton, closeButton);
        
            // إرسال الرسالة إلى قناة التذكرة
            await ticketChannel.send({
                embeds: [embed],
                content: `✨ تم فتح التذكرة بواسطة <@${interaction.user.id}>. يرجى عدم عمل منشن لأي إداري والتحلي بالصبر. ⏳`,
                components: [row],
            });
        
            // الرد على المستخدم بأن التذكرة تم فتحها
            await interaction.reply({
                content: `✅ تم فتح التذكرة بنجاح! <#${ticketChannel.id}>. يرجى الانتظار، سيتم التعامل مع طلبك قريبًا!`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error creating channel: ", error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء فتح التذكرة، يرجى المحاولة مرة أخرى.', ephemeral: true });
        }
    }

    if (interaction.customId === 'ticketModal') {
        const accountName = interaction.fields.getTextInputValue('accountName');
        const username = interaction.fields.getTextInputValue('username');
        const hours = interaction.fields.getTextInputValue('hours');
        const level = interaction.fields.getTextInputValue('level');
        const agreement = interaction.fields.getTextInputValue('agreement');

        const ticketChannelName = `ticket-${interaction.user.username.replace(/\W/g, '')}`;

        try {
            const ticketChannel = await interaction.guild.channels.create(ticketChannelName, {
                type: 'text',
                parent: '1303048571192610928',
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: interaction.user.id,
                        allow: ['VIEW_CHANNEL'],
                    },
                ],
            });
        
            // إنشاء Embed مع إيموجيات وتحسينات
            const embed = new MessageEmbed()
                .setColor('#0099ff') // اللون الأزرق
                .setTitle('📝 معلومات التذكرة')
                .addFields(
                    { name: '👤 اسم حسابك', value: accountName, inline: false },
                    { name: '🧑‍💻 اسمك داخل الخادم', value: username, inline: false },
                    { name: '⏱️ عدد ساعاتك', value: hours, inline: false },
                    { name: '🛡️ لفلك الحالي', value: level, inline: false },
                    { name: '✅ موافق على الالتزام', value: agreement, inline: false }
                )
                .setFooter('نظام التذاكر | Klebitz', interaction.guild.iconURL({ dynamic: true, size: 64 }))
                .setTimestamp();
        
            // إنشاء الأزرار (Button)
            const claimButton = new MessageButton()
                .setCustomId('claimTicket')
                .setLabel('👑 استلام التذكرة')
                .setStyle('SUCCESS');
        
            const closeButton = new MessageButton()
                .setCustomId('closeTicket')
                .setLabel('🔒 إغلاق التذكرة')
                .setStyle('DANGER');
        
            const row = new MessageActionRow().addComponents(claimButton, closeButton);
        
            // إرسال الرسالة إلى قناة التذكرة
            await ticketChannel.send({
                embeds: [embed],
                content: `✨ تم فتح التذكرة بواسطة <@${interaction.user.id}>. يرجى عدم عمل منشن لأي إداري والتحلي بالصبر. ⏳`,
                components: [row],
            });
        
            // الرد على المستخدم بأن التذكرة تم فتحها
            await interaction.reply({
                content: `✅ تم فتح التذكرة بنجاح! <#${ticketChannel.id}>. يرجى الانتظار، سيتم التعامل مع طلبك قريبًا!`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error creating channel: ", error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء فتح التذكرة، يرجى المحاولة مرة أخرى.', ephemeral: true });
        }
    }

    if (interaction.isButton() && interaction.customId === 'claimTicket') {
        const requiredRoleId = '1287405202353422441';
        if (!interaction.member.roles.cache.has(requiredRoleId)) {
            return interaction.reply({ content: 'ليس لديك الصلاحيات الكافية لاستلام التذكرة', ephemeral: true });
        }

        const ticketChannel = interaction.channel;
        if (!ticketChannel) {
            return interaction.reply({ content: 'حدث خطأ، لا يمكن العثور على القناة.', ephemeral: true });
        }

        // تخزين من استلم التذكرة في الخريطة
        ticketClaimedBy.set(ticketChannel.id, interaction.user.id);

            const embed = new MessageEmbed()
            .setColor('#32CD32')  // لون أخضر مميز
            .setTitle('✅ تم استلام التذكرة')
            .setDescription(`تم استلام التذكرة من قبل الإداري: <@${interaction.user.id}>\n`)
            .setTimestamp()
            .setFooter('نظام التذاكر | Klebitz', interaction.guild.iconURL({ dynamic: true, size: 64 }));  // يمكنك تغيير صورة الختم إذا لزم الأمر
        
        // إرسال الرسالة إلى قناة التذكرة
        await ticketChannel.send({ embeds: [embed] });
        
        // 1. إرسال رابط التذكرة عبر الخاص
        const embedd = new MessageEmbed()
            .setColor('#1E90FF')  // لون أزرق مميز
            .setTitle('🔔 تم استلام التذكرة الخاصة بك')
            .setDescription(`تم استلام التذكرة الخاصة بك من قبل الإداري: <@${interaction.user.id}>\nلزيارة التذكرة، يمكنك الضغط على الرابط التالي: [اضغط هنا لزيارة التذكرة](https://discord.com/channels/${interaction.guild.id}/${ticketChannel.id})`)
            .setTimestamp()
            .setFooter('نظام التذاكر | Klebitz', interaction.guild.iconURL({ dynamic: true, size: 64 }));

        // إرسال الرسالة إلى المستخدم عبر الخاص
        await interaction.user.send({ embeds: [embedd] });

        // تعطيل زر استلام التذكرة
        const disabledClaimButton = new MessageButton()
            .setCustomId('claimTicket')
            .setLabel('تم استلام التذكرة')
            .setStyle('SUCCESS')
            .setDisabled(true);

        // زر إغلاق التذكرة
        const closeButton = new MessageButton()
            .setCustomId('closeTicket')
            .setLabel('إغلاق التذكرة')
            .setStyle('DANGER');

        const row = new MessageActionRow().addComponents(disabledClaimButton, closeButton);

        // تحديث الرسالة التي تحتوي على الأزرار
        await interaction.update({
            components: [row],
        });
    }

    if (interaction.isButton() && interaction.customId === 'closeTicket') {
        const modal = new Modal()
            .setCustomId('closeTicketModal')
            .setTitle('سبب الإغلاق')
            .addComponents(
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId('closeReason')
                        .setLabel('سبب إغلاق التذكرة:')
                        .setRequired(true)
                        .setStyle('SHORT')
                )
            );

        await interaction.showModal(modal);
    }
});

karizma.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'closeTicketModal') {
        const closeReason = interaction.fields.getTextInputValue('closeReason');
        const ticketChannel = interaction.channel;

        // جمع جميع الرسائل في القناة
        const messages = await ticketChannel.messages.fetch({ limit: 100 });

        // ترتيب الرسائل من الأقدم إلى الأحدث
        const orderedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        // الحصول على تواريخ فتح وإغلاق التذكرة
        const openDate = ticketChannel.createdAt.toLocaleString();
        const closeDate = new Date().toLocaleString();

        // تنسيق الرسائل في HTML
        let htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2f3136; color: white; }
                    .message { background-color: #36393f; padding: 10px; border-radius: 5px; margin-bottom: 10px; display: flex; }
                    .avatar { border-radius: 50%; width: 40px; height: 40px; margin-right: 10px; }
                    .content { flex: 1; }
                    .username { font-weight: bold; color: #7289da; margin-bottom: 5px; }
                    .text { color: #dcddde; font-size: 14px; }
                    .footer { font-size: 0.9em; color: #b9bbbe; margin-top: 5px; }
                    .timestamp { color: #b9bbbe; font-size: 0.8em; }
                </style>
            </head>
            <body>
                <h1 style="color: #7289da; text-align: center;">سجل التذكرة</h1>
                <p><strong>التذكرة تم فتحها في:</strong> ${openDate}</p>
                <p><strong>التذكرة تم إغلاقها في:</strong> ${closeDate}</p>
                <p><strong>سبب الإغلاق:</strong> ${closeReason}</p>
                <hr/>
                <h2 style="color: #7289da;">الرسائل:</h2>
        `;

        orderedMessages.forEach(message => {
            // التعامل مع محتوى الرسالة
            let messageContent = message.content;

            // إضافة المرفقات
            if (message.attachments.size > 0) {
                message.attachments.forEach(attachment => {
                    messageContent += `\n[مرفق](${attachment.url})`;
                });
            }

            // إضافة الإيمبدات
            message.embeds.forEach(embed => {
                if (embed.url) {
                    messageContent += `\n[رابط الإيمبد](${embed.url})`;
                }
                if (embed.image) {
                    messageContent += `\n[صورة](${embed.image.url})`;
                }
            });

            // إذا كانت الرسالة فارغة، ضع نص بديل
            if (!messageContent || messageContent.trim() === "") {
                messageContent = "[لا توجد محتويات في هذه الرسالة]";
            }

            // إضافة الرسالة إلى السجل
            htmlContent += `
            <div class="message">
                <img src="${message.author.displayAvatarURL({ dynamic: true })}" alt="avatar" class="avatar"/>
                <div class="content">
                    <div class="username">${message.author.tag}</div>
                    <div class="text">${messageContent}</div>
                    <div class="footer">
                        <span class="timestamp">${new Date(message.createdTimestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            `;
        });

        // إغلاق الـ HTML
        htmlContent += `
        </body>
        </html>
        `;

        // تحديد مسار الملف
        const filePath = path.join(__dirname, `ticket-${ticketChannel.id}.html`);

        try {
            // حفظ السجل في ملف HTML
            await writeFile(filePath, htmlContent);

            // إرسال الإيمبد إلى الشخص في الخاص
            const embed = new MessageEmbed()
                .setColor('#ffff00')
                .setTitle(`تم إنهاء التعامل مع التذكرة`)
                .addFields(
                    { name: 'اسم التذكرة 📁', value: ticketChannel.name, inline: true },
                    { name: 'أنشأت بواسطة 👤', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'تم الاستلام بواسطة ✅', value: `<@${ticketClaimedBy.get(ticketChannel.id) || 'غير محدد'}>`, inline: true },
                    { name: 'وقت فتح التذكرة 📅', value: openDate, inline: true },
                    { name: 'وقت إغلاق التذكرة 📅', value: closeDate, inline: true },
                    { name: 'سبب الإغلاق 📖', value: closeReason, inline: true }
                )
                .setTimestamp();

            // إرسال الإيمبد إلى صاحب التذكرة في الخاص
            await interaction.user.send({ embeds: [embed] });

            // رفع الملف إلى قناة transcript مع الإيمبد
            const transcriptChannel = interaction.guild.channels.cache.get('1303689917313843302');
            if (transcriptChannel) {
                const file = new MessageAttachment(filePath, `ticket-${ticketChannel.id}.html`);
                await transcriptChannel.send({ embeds: [embed], files: [file] });

                // حذف الملف من النظام بعد رفعه
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('حدث خطأ أثناء حذف الملف:', err);
                    } else {
                        console.log('تم حذف الملف بنجاح.');
                    }
                });
            }

            // حذف القيد من الخريطة بعد إغلاق التذكرة
            ticketClaimedBy.delete(ticketChannel.id);

        } catch (error) {
            console.error("Error generating or sending transcript file:", error);
            await interaction.reply({ content: 'حدث خطأ أثناء إنشاء أو رفع السجل.', ephemeral: true });
        }

        // إرسال رسالة في القناة قبل إغلاق التذكرة
        const closingEmbed = new MessageEmbed()
            .setColor('#FF6347')  // لون أحمر
            .setTitle('⏳ سيتم إغلاق التذكرة')
            .setDescription('سيتم إغلاق هذه التذكرة في خلال ثانيتين. إذا كنت بحاجة إلى أي مساعدة إضافية، يرجى طلبها الآن.')
            .setTimestamp()
            .setFooter('نظام التذاكر | Klebitz', interaction.guild.iconURL({ dynamic: true, size: 64 }));

        await ticketChannel.send({ embeds: [closingEmbed] });

        // إغلاق التذكرة بعد ثانيتين
        setTimeout(async () => {
            // حذف القيد من الخريطة بعد إغلاق التذكرة
            ticketClaimedBy.delete(ticketChannel.id);

            // حذف القناة بعد رفع السجل
            await ticketChannel.delete();
        }, 2000); // تأخير 2 ثانية
    }
});

process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);

    const errorChannel = karizma.channels.cache.get("1303881619068813422");
    if (errorChannel) {
        await errorChannel.send(`🚨 **Uncaught Exception** 🚨\n\`\`\`${error.message}\`\`\``);
    }
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    const errorChannel = karizma.channels.cache.get("1303881619068813422");
    if (errorChannel) {
        await errorChannel.send(`🚨 **Unhandled Rejection** 🚨\n\`\`\`${reason}\`\`\``);
    }
});

karizma.login(botToken);