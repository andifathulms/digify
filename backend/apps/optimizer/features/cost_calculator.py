"""Fitur Tab 1 · Biaya Menu."""

from __future__ import annotations

from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.cost_calculator import SCHEMA_COST_CALCULATOR
from apps.optimizer.prompts.cost_calculator import (
    SYSTEM_COST_CALCULATOR,
    prompt_cost_calculator,
)


def hitung_biaya_menu(data: dict[str, Any]) -> dict[str, Any]:
    return call_gemini(
        system_instruction=SYSTEM_COST_CALCULATOR,
        user_prompt=prompt_cost_calculator(
            item_name=data["itemName"],
            ingredients_list=data["ingredientsList"],
            portion_weight=data["portionWeight"],
            current_price=data["currentPrice"],
        ),
        schema=SCHEMA_COST_CALCULATOR,
        endpoint="cost-calculator",
    )
