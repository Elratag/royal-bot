import express, { Response } from 'express';
import { authGuard, adminGuard, AuthenticatedRequest } from '../middlewares/authGuards.js';
import { getBotClient } from '../../bot/index.js';
import { prisma } from '../../database/index.js';
import { allCommands } from '../../bot/handlers/commandHandler.js';

const router = express.Router();

// 1. Get all accessible guilds for current user
router.get('/', authGuard, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const botClient = getBotClient();

  const enrichedGuilds = (user?.guilds || []).map(g => {
    const hasBot = botClient ? botClient.guilds.cache.has(g.id) : true;
    return {
      ...g,
      hasBot,
    };
  });

  res.json({ guilds: enrichedGuilds });
});

// 2. Get Guild Details & Stats (Channels, Roles, Counts)
router.get('/:guildId/details', authGuard, adminGuard, async (req: AuthenticatedRequest, res: Response) => {
  const { guildId } = req.params;
  const botClient = getBotClient();
  const guild = botClient?.guilds.cache.get(guildId);

  // Channels & Categories
  const channels = guild
    ? guild.channels.cache
        .map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          isVoice: c.isVoiceBased(),
          isText: c.isTextBased(),
          isCategory: c.type === 4 || (c.type as any) === 'GUILD_CATEGORY',
        }))
    : [
        { id: 'c1', name: 'general', type: 0, isVoice: false, isText: true, isCategory: false },
        { id: 'c2', name: 'welcome', type: 0, isVoice: false, isText: true, isCategory: false },
        { id: 'c3', name: 'logs', type: 0, isVoice: false, isText: true, isCategory: false },
        { id: 'c4', name: 'voice-lounge', type: 2, isVoice: true, isText: false, isCategory: false },
        { id: 'cat1', name: '🎫 TICKETS', type: 4, isVoice: false, isText: false, isCategory: true },
      ];

  // Roles
  const roles = guild
    ? guild.roles.cache.map(r => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
      }))
    : [
        { id: 'r1', name: '👑 Royal Master', color: '#D4AF37', position: 10 },
        { id: 'r2', name: '🛡️ Moderator', color: '#3B82F6', position: 8 },
        { id: 'r3', name: '💎 VIP Gold', color: '#E5C158', position: 5 },
        { id: 'r4', name: 'Member', color: '#9CA3AF', position: 1 },
      ];

  const totalTickets = await prisma.ticket.count({ where: { guildId } });
  const openTickets = await prisma.ticket.count({ where: { guildId, status: 'OPEN' } });

  res.json({
    guild: {
      id: guildId,
      name: guild?.name || 'Royal Realm',
      icon: guild?.iconURL() || null,
      memberCount: guild?.memberCount || 150,
      ownerId: guild?.ownerId || req.user?.id,
      botPing: botClient?.ws.ping || 24,
      totalTickets,
      openTickets,
    },
    channels,
    roles,
  });
});

// --- WELCOME SYSTEM ---
router.get('/:guildId/welcome', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  let config = await prisma.welcomeConfig.findUnique({ where: { guildId } });
  if (!config) {
    config = await prisma.welcomeConfig.create({ data: { guildId } });
  }
  res.json({ config });
});

router.put('/:guildId/welcome', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { enabled, channelId, message, embedEnabled, embedTitle, embedColor } = req.body;

  const updated = await prisma.welcomeConfig.upsert({
    where: { guildId },
    create: { guildId, enabled, channelId, message, embedEnabled, embedTitle, embedColor },
    update: { enabled, channelId, message, embedEnabled, embedTitle, embedColor },
  });

  await prisma.dashboardAuditLog.create({
    data: {
      guildId,
      userId: req.user!.id,
      action: 'UPDATE_WELCOME_SETTINGS',
      details: JSON.stringify({ enabled, channelId }),
    },
  });

  res.json({ success: true, config: updated });
});

// --- AUTO ROLES ---
router.get('/:guildId/autoroles', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  const autoRoles = await prisma.autoRole.findMany({ where: { guildId } });
  res.json({ autoRoles });
});

router.post('/:guildId/autoroles', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { roleId } = req.body;

  if (!roleId) return res.status(400).json({ error: 'roleId is required' });

  const existing = await prisma.autoRole.findFirst({ where: { guildId, roleId } });
  if (existing) return res.status(400).json({ error: 'Role already added to Auto Roles' });

  const created = await prisma.autoRole.create({
    data: { guildId, roleId },
  });

  await prisma.dashboardAuditLog.create({
    data: { guildId, userId: req.user!.id, action: 'ADD_AUTO_ROLE', details: JSON.stringify({ roleId }) },
  });

  res.json({ success: true, autoRole: created });
});

router.delete('/:guildId/autoroles/:id', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const id = parseInt(req.params.id, 10);
  await prisma.autoRole.delete({ where: { id } });

  await prisma.dashboardAuditLog.create({
    data: { guildId: req.params.guildId, userId: req.user!.id, action: 'DELETE_AUTO_ROLE', details: JSON.stringify({ id }) },
  });

  res.json({ success: true });
});

// --- COLOR ROLES ---
router.get('/:guildId/colorroles', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  let panel = await prisma.colorPanel.findFirst({
    where: { guildId },
    include: { options: true },
  });

  if (!panel) {
    panel = await prisma.colorPanel.create({
      data: {
        guildId,
        channelId: '',
        title: '👑 Royal Color Palette',
        description: 'Click below to select your signature VIP name color.',
        singleColor: true,
      },
      include: { options: true },
    });
  }

  res.json({ panel });
});

router.put('/:guildId/colorroles', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { title, description, channelId, singleColor } = req.body;

  let panel = await prisma.colorPanel.findFirst({ where: { guildId } });
  if (!panel) {
    panel = await prisma.colorPanel.create({
      data: { guildId, channelId: channelId || '', title, description, singleColor },
    });
  } else {
    panel = await prisma.colorPanel.update({
      where: { id: panel.id },
      data: { title, description, channelId, singleColor },
    });
  }

  res.json({ success: true, panel });
});

router.post('/:guildId/colorroles/options', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { roleId, name, emoji } = req.body;

  let panel = await prisma.colorPanel.findFirst({ where: { guildId } });
  if (!panel) {
    panel = await prisma.colorPanel.create({
      data: { guildId, channelId: '', title: '👑 Royal Color Palette' },
    });
  }

  const option = await prisma.colorOption.create({
    data: { panelId: panel.id, roleId, name, emoji },
  });

  res.json({ success: true, option });
});

router.delete('/:guildId/colorroles/options/:id', authGuard, adminGuard, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await prisma.colorOption.delete({ where: { id } });
  res.json({ success: true });
});

// --- LOGS SYSTEM ---
router.get('/:guildId/logs', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  let logs = await prisma.logConfig.findUnique({ where: { guildId } });
  if (!logs) {
    logs = await prisma.logConfig.create({ data: { guildId } });
  }
  res.json({ logs });
});

router.put('/:guildId/logs', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const {
    memberLogChannel,
    kickLogChannel,
    banLogChannel,
    voiceLogChannel,
    muteLogChannel,
    messageLogChannel,
    ticketLogChannel,
  } = req.body;

  const logs = await prisma.logConfig.upsert({
    where: { guildId },
    create: {
      guildId,
      memberLogChannel,
      kickLogChannel,
      banLogChannel,
      voiceLogChannel,
      muteLogChannel,
      messageLogChannel,
      ticketLogChannel,
    },
    update: {
      memberLogChannel,
      kickLogChannel,
      banLogChannel,
      voiceLogChannel,
      muteLogChannel,
      messageLogChannel,
      ticketLogChannel,
    },
  });

  await prisma.dashboardAuditLog.create({
    data: {
      guildId,
      userId: req.user!.id,
      action: 'UPDATE_LOGS_CHANNELS',
      details: JSON.stringify(req.body),
    },
  });

  res.json({ success: true, logs });
});

// --- TICKETS SYSTEM ---
router.get('/:guildId/tickets', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  let panel = await prisma.ticketPanel.findFirst({ where: { guildId } });
  if (!panel) {
    panel = await prisma.ticketPanel.create({
      data: {
        guildId,
        channelId: '',
        title: '🎟️ Royal Support Tickets',
        description: 'Need help? Click below to open a private ticket with staff.',
      },
    });
  }
  const recentTickets = await prisma.ticket.findMany({
    where: { guildId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({ panel, tickets: recentTickets });
});

router.put('/:guildId/tickets/panel', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { title, description, channelId, categoryId, supportRoleId, logsChannelId, welcomeMessage } = req.body;

  let panel = await prisma.ticketPanel.findFirst({ where: { guildId } });
  if (!panel) {
    panel = await prisma.ticketPanel.create({
      data: { guildId, channelId: channelId || '', title, description, categoryId, supportRoleId, logsChannelId, welcomeMessage },
    });
  } else {
    panel = await prisma.ticketPanel.update({
      where: { id: panel.id },
      data: { title, description, channelId, categoryId, supportRoleId, logsChannelId, welcomeMessage },
    });
  }

  res.json({ success: true, panel });
});

// --- AUTO RESPONSES ---
router.get('/:guildId/autoresp', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  const responses = await prisma.autoResponse.findMany({ where: { guildId } });
  res.json({ responses });
});

router.post('/:guildId/autoresp', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { trigger, response, exactMatch, channelId } = req.body;

  if (!trigger || !response) {
    return res.status(400).json({ error: 'Trigger and Response are required' });
  }

  const created = await prisma.autoResponse.create({
    data: { guildId, trigger, response, exactMatch: !!exactMatch, channelId: channelId || null },
  });

  res.json({ success: true, response: created });
});

router.delete('/:guildId/autoresp/:id', authGuard, adminGuard, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await prisma.autoResponse.delete({ where: { id } });
  res.json({ success: true });
});

// --- COMMAND MANAGEMENT ---
router.get('/:guildId/commands', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  const dbSettings = await prisma.commandSetting.findMany({ where: { guildId } });

  const commandList = allCommands.map(cmd => {
    const setting = dbSettings.find(s => s.commandName === cmd.data.name);
    return {
      name: cmd.data.name,
      description: cmd.data.description,
      category: cmd.category,
      enabled: setting ? setting.enabled : true,
    };
  });

  res.json({ commands: commandList });
});

router.put('/:guildId/commands/:commandName', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId, commandName } = req.params;
  const { enabled } = req.body;

  const setting = await prisma.commandSetting.upsert({
    where: { guildId_commandName: { guildId, commandName } },
    create: { guildId, commandName, enabled },
    update: { enabled },
  });

  res.json({ success: true, setting });
});

// --- BOT SETTINGS ---
router.get('/:guildId/botsettings', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  let settings = await prisma.botSetting.findUnique({ where: { guildId } });
  if (!settings) {
    settings = await prisma.botSetting.create({ data: { guildId } });
  }
  res.json({ settings });
});

router.put('/:guildId/botsettings', authGuard, adminGuard, async (req: AuthenticatedRequest, res) => {
  const { guildId } = req.params;
  const { statusText, statusType, onlineStatus, musicVolume, language } = req.body;

  const settings = await prisma.botSetting.upsert({
    where: { guildId },
    create: { guildId, statusText, statusType, onlineStatus, musicVolume, language },
    update: { statusText, statusType, onlineStatus, musicVolume, language },
  });

  // Update Bot Presence live if client is connected
  const bot = getBotClient();
  if (bot && bot.user) {
    bot.user.setPresence({
      activities: [{ name: statusText || '👑 Royal Service', type: 3 }],
      status: (onlineStatus as any) || 'online',
    });
  }

  res.json({ success: true, settings });
});

// --- DASHBOARD AUDIT LOGS ---
router.get('/:guildId/audit-logs', authGuard, adminGuard, async (req, res) => {
  const { guildId } = req.params;
  const logs = await prisma.dashboardAuditLog.findMany({
    where: { guildId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ logs });
});

export default router;
