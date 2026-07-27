"""Fitur Tab 2 · Harga Jual."""

from __future__ import annotations

from typing import Any

from apps.ai.gemini import call_gemini
from apps.ai.schemas.pricing import SCHEMA_PRICING
from apps.optimizer.features.hitungan import (
    break_even_delivery,
    break_even_dine_in,
    bulatkan_rupiah,
)
from apps.optimizer.prompts.pricing import SYSTEM_PRICING, prompt_pricing


def tentukan_harga(data: dict[str, Any]) -> dict[str, Any]:
    cogs = data["cogs"]
    komisi = data["platformFeePercent"]

    # Dihitung di Python, bukan oleh AI: rumusnya pasti dan angkanya dipakai
    # user untuk keputusan uang. Model hanya boleh menyarankan di atasnya.
    impas_dine_in = break_even_dine_in(cogs)
    impas_delivery = break_even_delivery(cogs, komisi)

    hasil = call_gemini(
        system_instruction=SYSTEM_PRICING,
        user_prompt=prompt_pricing(
            item_name=data["itemName"],
            cogs=cogs,
            target_margin=data["targetMargin"],
            competitor_price=data["competitorPrice"],
            platform_fee_percent=komisi,
            location=data["location"],
            impas_dine_in=impas_dine_in,
            impas_delivery=impas_delivery,
        ),
        schema=SCHEMA_PRICING,
        endpoint="pricing",
    )

    # Angka impas selalu versi Python, apa pun yang dikembalikan model.
    hasil["break_even_dine_in"] = impas_dine_in
    hasil["break_even_delivery"] = impas_delivery

    for kunci in ("dine_in_recommended", "delivery_recommended", "psychological_price"):
        if kunci in hasil:
            hasil[kunci] = bulatkan_rupiah(hasil[kunci])

    return hasil
