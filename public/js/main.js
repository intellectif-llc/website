const toggleButton = document.querySelector('.menu-btn');
const menuContainer = document.querySelector('.menu');
const menuItems = document.querySelectorAll('.menu-item');
let menuOpen = false;

if (toggleButton) {
    toggleButton.addEventListener('click', () => {
        menuOpen = !menuOpen;
        toggleButton.classList.toggle('open');

        if (menuOpen) {
            // Open menu
            menuContainer.classList.add('active');
            // Delay adding 'active' class to menu items
            setTimeout(() => {
                menuItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('active');
                    }, index * 50); // Stagger item appearance
                });
            }, 200); // Delay after background appears
        } else {
            // Close menu
            // Remove 'active' class from menu items with a staggered delay
            menuItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.remove('active');
                }, index * 50); // Stagger item disappearance
            });
            
            // Delay removing 'active' class from menu container
            setTimeout(() => {
                menuContainer.classList.remove('active');
            }, menuItems.length * 50 + 100); // Delay before menu slides up
        }
    });
}