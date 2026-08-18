import asyncio
import logging
from typing import Optional
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from backend.core.config import settings
from backend.bot.formatters import format_telegram_signal_card
from backend.bot.trade_executor import trade_executor
from backend.core.gmgn_client import gmgn_client
from backend.core.filters import analyze_token_security

logger = logging.getLogger(__name__)

class BiolumeTelegramBot:
    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.app: Optional[Application] = None

    def setup(self):
        if not self.token:
            logger.warning("Telegram BOT Token not configured. Telegram bot disabled.")
            return

        self.app = Application.builder().token(self.token).build()
        self.app.add_handler(CommandHandler("start", self.cmd_start))
        self.app.add_handler(CommandHandler("radar", self.cmd_radar))
        self.app.add_handler(CommandHandler("positions", self.cmd_positions))
        self.app.add_handler(CommandHandler("balance", self.cmd_balance))
        self.app.add_handler(CallbackQueryHandler(self.handle_callback))
        logger.info("Telegram Bot service initialized.")

    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        msg = (
            "🤖 **Welcome to Biolume Smart Money & Sniper Bot!**\n\n"
            "This bot tracks top-performing Solana wallets and high-potential tokens in real-time.\n\n"
            "📌 **Commands:**\n"
            "/radar - Scan and list top trending tokens\n"
            "/positions - View open trade positions\n"
            "/balance - Check wallet balance & status\n"
        )
        await update.message.reply_text(msg, parse_mode="Markdown")

    async def cmd_radar(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        tokens = await gmgn_client.get_trending_radar_tokens()
        if not tokens:
            await update.message.reply_text("No trending tokens found on radar at the moment.")
            return

        for t in tokens[:3]: # Send top 3 signals
            analysis = analyze_token_security(t, smart_wallets_active=t.get("smart_money_count", 2))
            card_text = format_telegram_signal_card(analysis)
            
            keyboard = [
                [
                    InlineKeyboardButton("⚡ Buy 0.1 SOL", callback_data=f"buy:0.1:{analysis.token_address}:{analysis.symbol}:{analysis.price_usd}"),
                    InlineKeyboardButton("⚡ Buy 0.5 SOL", callback_data=f"buy:0.5:{analysis.token_address}:{analysis.symbol}:{analysis.price_usd}")
                ],
                [
                    InlineKeyboardButton("🌐 GMGN.ai", url=f"https://gmgn.ai/sol/token/{analysis.token_address}"),
                    InlineKeyboardButton("❌ Dismiss", callback_data="ignore")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await update.message.reply_text(card_text, parse_mode="Markdown", reply_markup=reply_markup, disable_web_page_preview=True)

    async def cmd_positions(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        positions = trade_executor.get_positions()
        if not positions:
            await update.message.reply_text("No active open positions currently.")
            return
        
        text = "📊 **OPEN POSITIONS:**\n━━━━━━━━━━━━━━━━━━\n"
        for p in positions:
            text += f"• **${p['symbol']}** | {p['amount_sol']} SOL | Entry: ${p['entry_price_usd']} | Time: {p['buy_time']}\n"
        await update.message.reply_text(text, parse_mode="Markdown")

    async def cmd_balance(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        b = trade_executor.get_balance()
        mode_text = "🟡 Paper Trading (Simulation)" if b["mode"] == "PAPER" else "🟢 Live Solana Wallet"
        msg = (
            f"💰 **WALLET STATUS:**\n━━━━━━━━━━━━━━━━━━\n"
            f"Mode: {mode_text}\n"
            f"Balance: **{b['balance_sol']:.2f} SOL**\n"
            f"Open Positions: **{b['open_positions_count']}**"
        )
        await update.message.reply_text(msg, parse_mode="Markdown")

    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()
        data = query.data

        if data.startswith("buy:"):
            _, amount_str, addr, symbol, price_str = data.split(":")
            amount = float(amount_str)
            price = float(price_str)
            
            res = trade_executor.execute_quick_buy(addr, symbol, amount, price)
            if res.get("success"):
                await query.edit_message_reply_markup(reply_markup=None)
                await query.message.reply_text(
                    f"✅ **BUY ORDER EXECUTED:** {amount} SOL -> **${symbol}**\nRemaining Balance: {res.get('remaining_sol', 0):.2f} SOL",
                    parse_mode="Markdown"
                )
            else:
                await query.message.reply_text(f"❌ Execution Failed: {res.get('error')}")
        elif data == "ignore":
            await query.message.delete()

telegram_bot_service = BiolumeTelegramBot()
