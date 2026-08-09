<script>
	let { productNames = [] } = $props();

	let product = $state(productNames[0] ?? "");
	let quantity = $state(1);
	let name = $state("");
	let email = $state("");
	let notes = $state("");
	let botField = $state("");

	let canSend = $derived(name.trim().length > 0 && email.trim().length > 0);

	let status = $state("idle"); // idle | sending | sent | error

	let mailtoFallbackHref = $derived.by(() => {
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

	async function handleSubmit(event) {
		event.preventDefault();
		if (!canSend || status === "sending") return;
		status = "sending";
		try {
			const response = await fetch("/", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					"form-name": "order-request",
					"bot-field": botField,
					product,
					quantity: String(quantity),
					name,
					email,
					notes,
				}).toString(),
			});
			status = response.ok ? "sent" : "error";
		} catch {
			status = "error";
		}
	}
</script>

{#if status === "sent"}
	<div class="card">
		<h3>Order request sent</h3>
		<p>Thanks — we'll confirm final pricing and collection details by email.</p>
	</div>
{:else}
	<form class="order-form" name="order-request" data-netlify="true" data-netlify-honeypot="bot-field" onsubmit={handleSubmit}>
		<input type="hidden" name="form-name" value="order-request" />
		<label class="honeypot-field" aria-hidden="true">
			Leave this field blank
			<input type="text" name="bot-field" tabindex="-1" autocomplete="off" bind:value={botField} />
		</label>

		<label>
			Product
			<select name="product" bind:value={product}>
				{#each productNames as name}
					<option>{name}</option>
				{/each}
			</select>
		</label>

		<label>
			Quantity
			<input type="number" name="quantity" min="1" bind:value={quantity} />
		</label>

		<label>
			Your name
			<input type="text" name="name" bind:value={name} required />
		</label>

		<label>
			Your email
			<input type="email" name="email" bind:value={email} required />
		</label>

		<label>
			Notes (optional)
			<textarea name="notes" bind:value={notes} rows="2"></textarea>
		</label>

		<button class="btn btn-primary" class:disabled={!canSend} type="submit" disabled={!canSend || status === "sending"}>
			{status === "sending" ? "Sending…" : "Send order request"}
		</button>

		{#if status === "error"}
			<p class="form-note form-error">
				Something went wrong sending that — you can
				<a href={mailtoFallbackHref}>email your order to us directly</a> instead.
			</p>
		{:else}
			<p class="form-note">We'll confirm pricing and delivery by reply.</p>
		{/if}
	</form>
{/if}

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

	.form-error {
		color: var(--st-red, #dd4b59);
	}

	.disabled,
	.btn:disabled {
		pointer-events: none;
		opacity: 0.5;
	}

	.btn {
		width: fit-content;
		border: none;
		cursor: pointer;
		font: inherit;
	}

	.honeypot-field {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
