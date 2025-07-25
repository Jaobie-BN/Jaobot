const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
require('dotenv').config();

// สร้าง client ด้วย intents ที่จำเป็น
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ตั้งค่าต่างๆ
const WELCOME_CHANNEL_NAME = process.env.WELCOME_CHANNEL; // ชื่อช่องที่จะส่งข้อความต้อนรับ
const WELCOME_ROLE = process.env.WELCOME_ROLE; // ชื่อ Role ที่จะให้สมาชิกใหม่ (ถ้าไม่ต้องการให้เว้นว่าง)

// เมื่อบอทพร้อมใช้งาน
client.on('ready', () => {
    console.log(`🤖 ${client.user.tag} พร้อมใช้งานแล้ว!`);
    console.log(`📊 กำลังดูแลเซิร์ฟเวอร์ ${client.guilds.cache.size} เซิร์ฟเวอร์`);
    
    // ตั้งสถานะบอท
    client.user.setActivity('ต้อนรับสมาชิกใหม่', { type: 'WATCHING' });
});

// เมื่อมีสมาชิกใหม่เข้าเซิร์ฟเวอร์
client.on('guildMemberAdd', async (member) => {
    console.log(`👋 สมาชิกใหม่: ${member.user.tag} เข้าร่วม ${member.guild.name}`);
    
    try {
        // หาช่องที่จะส่งข้อความ
        const welcomeChannel = member.guild.channels.cache.find(
            channel => channel.name === WELCOME_CHANNEL_NAME
        );
        
        if (!welcomeChannel) {
            console.log(`❌ ไม่พบช่อง ${WELCOME_CHANNEL_NAME}`);
            return;
        }

        // สร้าง embed ข้อความต้อนรับ
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🎉 ยินดีต้อนรับสู่เซิร์ฟเวอร์!')
            .setDescription(`สวัสดี ${member}! เราดีใจที่คุณมาร่วมด้วย`)
            .setColor('#00ff00')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 สมาชิกคนที่', value: `${member.guild.memberCount}`, inline: true },
                { name: '📅 วันที่เข้าร่วม', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '📋 กฎของเซิร์ฟเวอร์', value: 'อย่าลืมอ่านกฎก่อนแชทนะ!', inline: false }
            )
            .setFooter({ 
                text: `ID: ${member.user.id}`, 
                iconURL: member.guild.iconURL() 
            })
            .setTimestamp();

        // ส่งข้อความต้อนรับ
        await welcomeChannel.send({ 
            content: `${member} มาใหม่นี่! 👋`,
            embeds: [welcomeEmbed] 
        });

        // เพิ่ม Role ให้สมาชิกใหม่ (ถ้าตั้งค่าไว้)
        if (WELCOME_ROLE) {
            const role = member.guild.roles.cache.find(r => r.name === WELCOME_ROLE);
            if (role) {
                await member.roles.add(role);
                console.log(`✅ เพิ่ม role ${WELCOME_ROLE} ให้ ${member.user.tag}`);
            }
        }

        // ส่งข้อความส่วนตัวให้สมาชิกใหม่
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(`ยินดีต้อนรับสู่ ${member.guild.name}!`)
                .setDescription('ขอบคุณที่เข้าร่วมเซิร์ฟเวอร์ของเรา')
                .setColor('#0099ff')
                .addFields(
                    { name: '📖 วิธีใช้งาน', value: 'พิมพ์ `!help` เพื่อดูคำสั่งต่างๆ' },
                    { name: '❓ ต้องการความช่วยเหลือ', value: 'ติดต่อแอดมินได้เลย!' }
                );

            await member.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log(`⚠️  ไม่สามารถส่ง DM ให้ ${member.user.tag}`);
        }

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในระบบต้อนรับ:', error);
    }
});

// เมื่อสมาชิกออกจากเซิร์ฟเวอร์
client.on('guildMemberRemove', async (member) => {
    console.log(`👋 สมาชิกออก: ${member.user.tag} ออกจาก ${member.guild.name}`);
    
    try {
        const channel = member.guild.channels.cache.find(
            ch => ch.name === WELCOME_CHANNEL_NAME
        );
        
        if (channel) {
            const leaveEmbed = new EmbedBuilder()
                .setTitle('😢 มีคนออกจากเซิร์ฟเวอร์')
                .setDescription(`${member.user.tag} ได้ออกจากเซิร์ฟเวอร์แล้ว`)
                .setColor('#ff0000')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👥 สมาชิกคงเหลือ', value: `${member.guild.memberCount}`, inline: true }
                )
                .setTimestamp();

            await channel.send({ embeds: [leaveEmbed] });
        }
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในระบบอำลา:', error);
    }
});

// คำสั่งพื้นฐาน
client.on('messageCreate', async (message) => {
    // ไม่ตอบกลับบอท
    if (message.author.bot) return;
    
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // คำสั่ง help
    if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('📋 คำสั่งทั้งหมด')
            .setColor('#0099ff')
            .addFields(
                { name: '!help', value: 'แสดงคำสั่งทั้งหมด' },
                { name: '!ping', value: 'ตรวจสอบความเร็วบอท' },
                { name: '!server', value: 'ข้อมูลเซิร์ฟเวอร์' },
                { name: '!user', value: 'ข้อมูลของคุณ' }
            );
        
        message.reply({ embeds: [helpEmbed] });
    }
    
    // คำสั่ง ping
    else if (command === 'ping') {
        const sent = await message.reply('🏓 กำลังวัด ping...');
        const ping = sent.createdTimestamp - message.createdTimestamp;
        await sent.edit(`🏓 Pong! ความหน่วง: ${ping}ms | API: ${Math.round(client.ws.ping)}ms`);
    }
    
    // คำสั่งข้อมูลเซิร์ฟเวอร์
    else if (command === 'server') {
        const serverEmbed = new EmbedBuilder()
            .setTitle(`📊 ข้อมูล ${message.guild.name}`)
            .setThumbnail(message.guild.iconURL())
            .setColor('#00ff00')
            .addFields(
                { name: '👥 สมาชิก', value: `${message.guild.memberCount}`, inline: true },
                { name: '📅 สร้างเมื่อ', value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: '👑 เจ้าของเซิร์ฟเวอร์', value: `<@${message.guild.ownerId}>`, inline: true }
            );
        
        message.reply({ embeds: [serverEmbed] });
    }
    
    // คำสั่งข้อมูลผู้ใช้
    else if (command === 'user') {
        const userEmbed = new EmbedBuilder()
            .setTitle(`👤 ข้อมูล ${message.author.tag}`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setColor('#0099ff')
            .addFields(
                { name: '🆔 ID', value: message.author.id, inline: true },
                { name: '📅 สร้าง Discord', value: `<t:${Math.floor(message.author.createdTimestamp / 1000)}:F>`, inline: true },
                { name: '📅 เข้าเซิร์ฟเวอร์', value: `<t:${Math.floor(message.member.joinedTimestamp / 1000)}:F>`, inline: true }
            );
        
        message.reply({ embeds: [userEmbed] });
    }
});

// Error handling
client.on('error', error => {
    console.error('❌ เกิดข้อผิดพลาด:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login บอท
client.login(process.env.BOT_TOKEN);

// คำแนะนำการใช้งาน:
// 1. แทนที่ YOUR_BOT_TOKEN_HERE ด้วย token จริง
// 2. เปลี่ยน WELCOME_CHANNEL_NAME เป็นชื่อช่องที่ต้องการ
// 3. ตั้งค่า WELCOME_ROLE หากต้องการให้ role อัตโนมัติ
// 4. ติดตั้ง: npm install discord.js
// 5. รัน: node bot.js