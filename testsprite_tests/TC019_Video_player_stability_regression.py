import asyncio
import os
from playwright import async_api
from playwright.async_api import expect


async def run_test():
    session_url = os.environ.get("REPLAY_SESSION_URL")
    if not session_url:
        raise AssertionError("Set REPLAY_SESSION_URL to an authenticated video session detail URL.")

    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(headless=True)
        storage_state = os.environ.get("PLAYWRIGHT_STORAGE_STATE")
        context_options = {}
        if storage_state:
            context_options["storage_state"] = storage_state
        context = await browser.new_context(**context_options)
        context.set_default_timeout(10000)

        page = await context.new_page()
        await page.goto(session_url, wait_until="domcontentloaded", timeout=15000)

        video = page.get_by_test_id("replay-video")
        slider = page.get_by_test_id("video-seek-slider")
        await expect(video).to_be_visible()
        await expect(slider).to_be_visible()

        await page.wait_for_function(
            """() => {
                const video = document.querySelector('[data-testid="replay-video"]');
                return video && Number.isFinite(video.duration) && video.duration > 8;
            }"""
        )

        initial_src = await video.evaluate("node => node.currentSrc || node.src")

        # Seek before pressing play. This catches controls that only update UI
        # state but do not update the underlying HTMLMediaElement currentTime.
        await slider.evaluate(
            """node => {
                node.value = '5';
                node.dispatchEvent(new Event('input', { bubbles: true }));
                node.dispatchEvent(new Event('change', { bubbles: true }));
            }"""
        )
        await page.wait_for_function(
            """() => {
                const video = document.querySelector('[data-testid="replay-video"]');
                return video && Math.abs(video.currentTime - 5) < 0.5;
            }"""
        )

        await video.evaluate(
            """node => {
                node.currentTime = 7;
                node.volume = 0.35;
                node.playbackRate = 1.5;
            }"""
        )

        # Session-detail UI updates should re-render the parent without
        # replacing the media source or resetting element-owned playback state.
        for tab_name in ["Notes", "Bookmarks", "Transcript"]:
            tab = page.get_by_role("tab", name=tab_name)
            if await tab.count():
                await tab.click()

        await page.wait_for_timeout(500)

        final_state = await video.evaluate(
            """node => ({
                src: node.currentSrc || node.src,
                currentTime: node.currentTime,
                volume: node.volume,
                playbackRate: node.playbackRate,
            })"""
        )

        assert final_state["src"] == initial_src, "Video src changed during parent re-render."
        assert abs(final_state["currentTime"] - 7) < 0.75, "Current timestamp reset during parent re-render."
        assert abs(final_state["volume"] - 0.35) < 0.01, "Volume reset during parent re-render."
        assert final_state["playbackRate"] == 1.5, "Playback speed reset during parent re-render."

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
