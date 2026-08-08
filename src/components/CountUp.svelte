<script>
	let { end, suffix = "", duration = 1200 } = $props();
	let value = $state(0);

	$effect(() => {
		const start = performance.now();
		let raf;
		function tick(now) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			value = Math.round(end * eased);
			if (progress < 1) raf = requestAnimationFrame(tick);
		}
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<strong>{value.toLocaleString()}{suffix}</strong>
