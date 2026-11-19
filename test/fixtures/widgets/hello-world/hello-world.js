export default function decorate(widget) {
  const target = widget.querySelector('.name');
  if (target) target.textContent = widget.dataset.firstName || 'world';
}
