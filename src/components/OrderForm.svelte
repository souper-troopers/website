<script>
	let product = $state("Troopers Coffee — Dignity Blend");
	let quantity = $state(1);
	let name = $state("");
	let email = $state("");
	let notes = $state("");

	let canSend = $derived(name.trim().length > 0 && email.trim().length > 0);

	let mailtoHref = $derived.by(() => {
		const subject = encodeURIComponent(`Order request: ${product}`);
		const lines = [
			`Product: ${product}`,
			`Quantity: ${quantity}`,
			`Name: ${name}`,
			`Email: ${email}`,
			notes.trim() ? `Notes: ${notes}` : null,
		].filter(Boolean);
		const body = encodeURIComponent(lines.join("\n"));
		return `mailto:manager@soupertroopers.org?subject=${subject}&body=${body}`;
	});
</script>

<form class="order-form">
	<label>
		Product
		<select bind:value={product}>
			<option>Troopers Coffee — Dignity Blend</option>
			<option>African Worry Dolls™</option>
		</select>
	</label>

	<label>
		Quantity
		<input type="number" min="1" bind:value={quantity} />
	</label>

	<label>
		Your name
		<input type="text" bind:value={name} required />
	</label>

	<label>
		Your email
		<input type="email" bind:value={email} required />
	</label>

	<label>
		Notes (optional)
		<textarea bind:value={notes} rows="2"></textarea>
	</label>

	<a class="btn btn-primary" class:disabled={!canSend} href={canSend ? mailtoHref : undefined} aria-disabled={!canSend}>
		Send order request
	</a>
	<p class="form-note">
		Opens your email client with the order pre-filled — we'll confirm pricing and delivery by reply.
	</p>
</form>

<style>
	.order-form {
		display: grid;
		gap: 1rem;
		max-width: 420px;
	}

	label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--st-ink, #24232b);
	}

	input,
	select,
	textarea {
		font: inherit;
		padding: 0.6rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		background: white;
	}

	.form-note {
		font-size: 0.85rem;
		color: rgba(36, 35, 43, 0.65);
		margin: 0;
	}

	.disabled {
		pointer-events: none;
		opacity: 0.5;
	}

	.btn {
		width: fit-content;
	}
</style>
