document.documentElement.classList.add('has-main');

const starCanvas = document.getElementById('starfield');
const ctx = starCanvas?.getContext('2d');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let stars = [];
let width = 0;
let height = 0;
let animationFrameId = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;

function resizeStarfield() {
  if (!starCanvas || !ctx) return;

  width = window.innerWidth;
  height = window.innerHeight;

  const ratio = window.devicePixelRatio || 1;
  starCanvas.width = width * ratio;
  starCanvas.height = height * ratio;
  starCanvas.style.width = `${width}px`;
  starCanvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const density = Math.max(70, Math.floor((width * height) / 18000));
  stars = Array.from({ length: density }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.4 + 0.25,
    alpha: Math.random() * 0.42 + 0.18,
    drift: (Math.random() - 0.5) * 0.12,
    depth: Math.random() * 0.9 + 0.1,
    twinkle: Math.random() * 0.002 + 0.0008,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawStarfield(time = 0) {
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  for (const star of stars) {
    const pulse = 0.72 + Math.sin(time * star.twinkle + star.phase) * 0.28;
    const parallaxX = (pointerX - width / 2) * 0.008 * star.depth;
    const parallaxY = (pointerY - height / 2) * 0.006 * star.depth;
    const x = (star.x + parallaxX + width) % width;
    const y = (star.y + parallaxY + height) % height;
    const radius = star.size * (0.65 + star.depth * 0.55);
    const alpha = Math.max(0.08, star.alpha * pulse);

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    star.y += star.drift + star.depth * 0.02;
    if (star.y < 0) star.y = height;
    if (star.y > height) star.y = 0;
  }

  if (!prefersReducedMotion) {
    animationFrameId = requestAnimationFrame(drawStarfield);
  }
}

function setupRevealAnimations() {
  const revealNodes = document.querySelectorAll('.reveal:not(.visible)');
  if (!revealNodes.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealNodes.forEach((node) => node.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -8% 0px'
  });

  revealNodes.forEach((node) => observer.observe(node));
}

function unlockPageContent() {
  document.body.classList.remove('intro-lock');
  setupRevealAnimations();
}

function setupHeroIntro() {
  const heroTypeLines = document.querySelectorAll('.hero-title-line');
  if (!heroTypeLines.length) {
    unlockPageContent();
    return;
  }

  if (prefersReducedMotion) {
    heroTypeLines.forEach((line) => line.classList.add('is-visible'));
    unlockPageContent();
    return;
  }

  const delays = [220, 1780, 4120];
  heroTypeLines.forEach((line, index) => {
    window.setTimeout(() => {
      line.classList.add('is-visible');
    }, delays[index] || 0);
  });

  window.setTimeout(unlockPageContent, 4700);
}

function setupWalletPicker() {
  const walletPicker = document.querySelector('[data-wallet-picker]');
  if (!walletPicker) return;

  const walletConfigs = {
    erc20: {
      title: 'Ethereum',
      address: '0x18269b0dafb71c1a66d8f93c61e55e5d3e991c4b',
      qrs: [
        { label: 'USDT', src: 'Qrs/ERC20(USDT).JPG', alt: 'QR code for ERC20 USDT' },
        { label: 'ETH', src: 'Qrs/ERC20(ETH).JPG', alt: 'QR code for ERC20 ETH' }
      ]
    },
    trc20: {
      title: 'Tron',
      address: 'TYYKMww4jR1xUvrg7LLM4Z9SQ5JCUnGkxW',
      qrs: [
        { label: 'USDT', src: 'Qrs/TRC20(USDT).JPG', alt: 'QR code for TRC20 USDT' }
      ]
    },
    bep20: {
      title: 'BNB Smart Chain',
      address: '0x18269b0dafb71c1a66d8f93c61e55e5d3e991c4b',
      qrs: [
        { label: 'USDT', src: 'Qrs/BEP20(USDT).JPG', alt: 'QR code for BEP20 USDT' },
        { label: 'BTC', src: 'Qrs/BEP20(BTC).JPG', alt: 'QR code for BEP20 BTC' }
      ]
    },
    ton: {
      title: 'TON',
      address: 'UQDsmV75bnid9qs92I5FPwEIOuhDCYuUWN2pCCvBvUKazvnr',
      qrs: [
        { label: 'TON', src: 'Qrs/TON.png', alt: 'QR code for TON' }
      ]
    }
  };

  const tabs = walletPicker.querySelectorAll('.network-tab');
  const titleNode = walletPicker.querySelector('[data-wallet-title]');
  const addressNode = walletPicker.querySelector('[data-wallet-address]');
  const qrFrameNode = walletPicker.querySelector('[data-wallet-qr-frame]');
  const qrGridNode = walletPicker.querySelector('[data-wallet-qr-grid]');
  let copiedStateTimeout = 0;

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'absolute';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    document.body.removeChild(helper);
  };

  const handleAddressCopy = async () => {
    if (addressNode.classList.contains('is-hidden')) return;

    const address = addressNode.dataset.address || addressNode.textContent.trim();
    if (!address) return;

    const originalLabel = addressNode.dataset.copyLabel || address;

    try {
      await copyText(address);
      window.clearTimeout(copiedStateTimeout);
      addressNode.classList.add('is-copied');
      addressNode.textContent = 'Copied';
      copiedStateTimeout = window.setTimeout(() => {
        addressNode.classList.remove('is-copied');
        addressNode.textContent = originalLabel;
      }, 1400);
    } catch (error) {
      console.error('Failed to copy wallet address.', error);
    }
  };

  const setWallet = (networkKey) => {
    const config = walletConfigs[networkKey];
    if (!config) return;

    tabs.forEach((tab) => {
      const isActive = tab.dataset.network === networkKey;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    titleNode.textContent = config.title;
    addressNode.dataset.address = config.address;
    addressNode.dataset.copyLabel = config.address;
    addressNode.textContent = config.address;
    addressNode.classList.remove('is-hidden');
    addressNode.classList.add('is-copyable');
    addressNode.setAttribute('role', 'button');
    addressNode.setAttribute('tabindex', '0');
    addressNode.setAttribute('aria-label', `Copy ${config.title} wallet address`);
    addressNode.classList.remove('is-copied');
    qrFrameNode.classList.remove('is-hidden');
    qrGridNode.innerHTML = '';

    config.qrs.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'wallet-qr-card';

      const label = document.createElement('div');
      label.className = 'wallet-qr-card-label';
      label.textContent = item.label;

      const image = document.createElement('img');
      image.className = 'wallet-qr-image';
      image.src = item.src;
      image.alt = item.alt;
      image.loading = 'lazy';

      card.append(label, image);
      qrGridNode.appendChild(card);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setWallet(tab.dataset.network));
  });

  addressNode.addEventListener('click', handleAddressCopy);
  addressNode.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleAddressCopy();
  });
}

try {
  resizeStarfield();
  setupHeroIntro();
  setupWalletPicker();

  window.addEventListener('resize', resizeStarfield);
  window.addEventListener('mousemove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
  });

  if (prefersReducedMotion) {
    drawStarfield();
  } else {
    animationFrameId = requestAnimationFrame(drawStarfield);
  }

  window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrameId));
} catch (error) {
  document.documentElement.classList.remove('has-main');
  document.body.classList.remove('intro-lock');
  console.error('Interactive enhancements failed to initialize.', error);
}
