function toggleVisibility(id) {
    const element = document.getElementById(id);
    const chevron = document.getElementById(id + "-chevron");

    if (element) {
        element.classList.toggle('hidden');

        if (chevron) {
            if (chevron.classList.contains('fa-chevron-down')) {
                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-up');
            } else {
                chevron.classList.remove('fa-chevron-up');
                chevron.classList.add('fa-chevron-down');
            }
        }
    }
}