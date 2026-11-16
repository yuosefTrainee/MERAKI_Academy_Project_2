
// =====================================
// SHOPORA - NAVIGATION MANAGEMENT
// =====================================

export function showPage(pageId) {

    // Find selected page
    const selectedPage = $(`#${pageId}`);

    if (selectedPage.length === 0) {
        console.error(`Page not found: ${pageId}`);
        return;
    }

    // Hide all pages
    $(".page")
        .removeClass("active")
        .addClass("hidden");

    // Show selected page
    selectedPage
        .removeClass("hidden")
        .addClass("active");

    // Reset page scroll
    window.scrollTo(0, 0);

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Reset scroll after browser updates the layout
    setTimeout(() => {

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto"
        });

        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

    }, 100);

}