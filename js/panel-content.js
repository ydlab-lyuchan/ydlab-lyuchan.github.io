window.YdlabPublic = (() => {
	const API = "https://quotation.ydlab.cc/public/website/"
	async function read(url) {
		const CONTROLLER = new AbortController()
		const TIMER = setTimeout(() => CONTROLLER.abort(), 8000)
		try {
			const RESPONSE = await fetch(url, {
				cache: "no-store",
				credentials: "omit",
				signal: CONTROLLER.signal,
			})
			if (!RESPONSE.ok) throw Error("無法取得官網內容")
			return await RESPONSE.json()
		} finally {
			clearTimeout(TIMER)
		}
	}
	async function load(name, fallback) {
		try {
			return await read(API + name)
		} catch (error) {
			if (fallback) return read(fallback)
			throw error
		}
	}
	function setText(selector, value) {
		for (const ELEMENT of document.querySelectorAll(selector))
			ELEMENT.textContent = value || ""
	}
	function apply(profile) {
		setText(".hero h1", profile.home_title)
		setText(".hero .tagline", profile.home_tagline)
		setText(".hero .hero-lead", profile.home_description)
		if (document.body.dataset.sitePage === "about") {
			setText(".page-head h1", profile.about_title)
			const PROSE = document.querySelector(".prose")
			if (PROSE) {
				PROSE.replaceChildren(
					...profile.about_text.split(/\n\s*\n/).map((paragraph) => {
						const P = document.createElement("p")
						P.textContent = paragraph
						return P
					}),
				)
				const LIST = document.createElement("ul")
				for (const LINE of profile.about_services.split("\n").filter(Boolean)) {
					const ITEM = document.createElement("li")
					ITEM.textContent = LINE
					LIST.append(ITEM)
				}
				PROSE.append(LIST)
			}
		}
		if (document.body.dataset.sitePage === "contact")
			setText(".page-head .section-desc", profile.contact_intro)
		for (const [KEY, SELECTOR] of [
			["services", "#services .card"],
			["process", ".process .card"],
		]) {
			for (const [INDEX, CARD] of [
				...document.querySelectorAll(SELECTOR),
			].entries()) {
				const ITEM = profile[KEY]?.[INDEX]
				if (ITEM) {
					CARD.querySelector("h3").textContent = ITEM.title
					CARD.querySelector("p").textContent = ITEM.text
				}
			}
		}
		setText(
			".footer-info .footer-line:first-child .footer-item",
			profile.company + " / 統編 " + profile.tax_id,
		)
		for (const LINK of document.querySelectorAll(
			'a[href^="mailto:"], a[data-site-email]',
		)) {
			LINK.href = "mailto:" + profile.email
			LINK.textContent =
				(LINK.closest("footer") ? "電子郵件：" : "") + profile.email
		}
		for (const LINK of document.querySelectorAll(
			'a[href^="tel:"], a[data-site-phone]',
		)) {
			LINK.href = "tel:" + profile.phone.replace(/[^\d+]/g, "")
			LINK.textContent =
				(LINK.closest("footer") ? "聯絡電話：" : "") + profile.phone
		}
		for (const LINK of document.querySelectorAll('a[href^="https://lin.ee/"]'))
			LINK.href = profile.line_url
		if (profile.line_qr)
			for (const IMAGE of document.querySelectorAll(".contact-line-qr"))
				IMAGE.src = profile.line_qr
	}
	load("content.json")
		.then(apply)
		.catch(() => {})
	return { load }
})()
