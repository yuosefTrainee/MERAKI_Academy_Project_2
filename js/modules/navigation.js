// Navigation Management

export function showPage(pageId) {

    // Hide all pages
    $(".page").removeClass("active").addClass("hidden");

    // Show selected page
    const selectedPage = $(`#${pageId}`);

    if (selectedPage.length === 0) {
        console.error(`Page not found: ${pageId}`);
        return;
    }

    selectedPage.removeClass("hidden").addClass("active");

    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}