/* Luffarschack – Spelkänsla
 * - Spelarkort med aktiv tur
 * - Hover-”spöke” som visar X/O
 * - Pop-animation, senaste-drag-highlight
 * - Tur-timer-bar som nollställs varje drag
 * - Konfetti + vinnarlinje
 * - Draglogg, tangentbordsstöd och ARIA-status
 */

(() => {
  const boardEl = document.getElementById('board');
  const cells = Array.from(document.querySelectorAll('.cell'));
  const statusEl = document.getElementById('status');
  const winLine = document.getElementById('winLine');
  const turnBar = document.getElementById('turnBar');

  // HUD
  const pX = document.getElementById('pX');
  const pO = document.getElementById('pO');

  // Score
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const scoreDEl = document.getElementById('scoreD');

  // Buttons
  const resetBtn = document.getElementById('resetBtn');
  const clearScoreBtn = document.getElementById('clearScoreBtn');
  const swapStartBtn = document.getElementById('swapStartBtn');

  // Misc
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // FX canvas
  const fx = document.getElementById('fx');
  const ctx = fx.getContext('2d');

  // Layout canvas to board size
  function sizeFX() {
    const r = boardEl.getBoundingClientRect();
    fx.width = Math.floor(r.width);
    fx.height = Math.floor(r.height);
  }
  const ro = new ResizeObserver(sizeFX);
  ro.observe(boardEl);

  const WIN = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diags
  ];

  const store = {
    key: 'ttt-score-v2',
 read(){
   try{
     const raw = localStorage.getItem(this.key);
     return raw ? JSON.parse(raw) : { X:0, O:0, D:0 };
   }catch{ return { X:0, O:0, D:0 }; }
 },
 write(obj){
   try{ localStorage.setItem(this.key, JSON.stringify(obj)); }catch{}
 }
  };

  let board = Array(9).fill(null);
  let current = 'X';
  let gameOver = false;
  let lastMove = -1;
  let nextStarter = 'X'; // växlas om man vill

  // Timer
  const TURN_MS = 12000; // 12s visuell timer
  let timerId = null;
  function startTurnTimer(){
    turnBar.style.transition = 'none';
    turnBar.style.transform = 'scaleX(1)';
    // force reflow
    void turnBar.offsetWidth;
    turnBar.style.transition = `transform ${TURN_MS}ms linear`;
    turnBar.style.transform = 'scaleX(0)';
    clearTimeout(timerId);
    timerId = setTimeout(()=> {
      // Visuellt: när tiden går ut – byt tur (om ingen lagt)
      if (!gameOver){
        setStatus(`Tiden gick ut – turen går vidare till ${other(current)}.`);
        current = other(current);
        setTurnUI();
        setGhosts();
        startTurnTimer();
      }
    }, TURN_MS);
  }
  function stopTurnTimer(){
    clearTimeout(timerId);
    turnBar.style.transition = 'none';
    turnBar.style.transform = 'scaleX(0)';
  }

  // UI helpers
  function setStatus(msg){ statusEl.textContent = msg; }
  function other(p){ return p === 'X' ? 'O' : 'X'; }
  function setTurnUI(){
    pX.classList.toggle('active', current === 'X');
    pO.classList.toggle('active', current === 'O');
  }
  function updateScoreUI(){
    const s = store.read();
    scoreXEl.textContent = s.X;
    scoreOEl.textContent = s.O;
    scoreDEl.textContent = s.D;
  }

  // Hover-spöke (ghost)
  function setGhosts(){
    cells.forEach((c, i) => {
      const empty = !board[i];
      c.classList.toggle('empty', empty);
      if (empty) c.setAttribute('data-ghost', current);
      else c.removeAttribute('data-ghost');
    });
  }

  function resetBoard(keepStarter=false){
    board = Array(9).fill(null);
    gameOver = false;
    lastMove = -1;
    winLine.style.opacity = 0;
    winLine.style.transform = 'scaleX(0)';
    cells.forEach((c, i) => {
      c.textContent = '';
      c.classList.remove('x','o','placed','last');
      c.setAttribute('aria-label', `Ruta ${i+1} tom`);
      c.disabled = false;
    });
    current = keepStarter ? nextStarter : 'X';
    setTurnUI();
    setStatus(`Spelare ${current} börjar`);
    setGhosts();
    sizeFX();
    startTurnTimer();
    clearMoves();
    focusFirst();
  }

  function focusFirst(){ cells[0].focus({preventScroll:true}); }

  // Vinnarlinje position
  function showWinLine(combination){
    const idx = WIN.findIndex(w => w.every((v,i)=>v===combination[i]));
    const rowH = (row) => {
      winLine.style.top = `calc(${row * 33.333}% + ${(row)*10}px)`;
      winLine.style.left = 0;
      winLine.style.height = 'calc(33.333% - 10px)';
      winLine.style.transformOrigin = 'left center';
      winLine.style.transform = 'scaleX(1)';
    };
    const colV = (col) => {
      winLine.style.top = 0;
      winLine.style.left = `calc(${col * 33.333}% + ${(col)*10}px)`;
      winLine.style.height = 'calc(33.333% - 10px)';
      winLine.style.transformOrigin = 'left top';
      winLine.style.transform = 'rotate(90deg) scaleX(1)';
    };

    if (idx >= 0 && idx <= 2) rowH(idx);
    else if (idx >= 3 && idx <= 5) colV(idx-3);
    else if (idx === 6){
      winLine.style.top = 0;
      winLine.style.left = 0;
      winLine.style.height = 'calc(141% - 10px)';
      winLine.style.transformOrigin = 'left top';
      winLine.style.transform = 'rotate(45deg)';
    } else if (idx === 7){
      winLine.style.top = 0;
      winLine.style.left = 'auto';
      winLine.style.right = 0;
      winLine.style.height = 'calc(141% - 10px)';
      winLine.style.transformOrigin = 'right top';
      winLine.style.transform = 'rotate(-45deg)';
    }

    requestAnimationFrame(() => {
      winLine.style.opacity = 1;
      if (idx <= 5) winLine.style.transform = getComputedStyle(winLine).transform;
    });
  }

  // Vinst/draw koll
  function checkWinner(){
    for (const combo of WIN){
      const [a,b,c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]){
        return { winner: board[a], combo };
      }
    }
    if (board.every(Boolean)) return { draw: true };
    return null;
  }

  // Konfetti: superlätt partikelkanon
  let particles = [];
  function burstConfetti(){
    sizeFX();
    const N = 120;
    particles = [];
    for (let i=0;i<N;i++){
      particles.push({
        x: fx.width/2,
        y: fx.height/3,
        vx: (Math.random()-0.5)*6,
                     vy: (Math.random()*-4)-2,
                     g: 0.09 + Math.random()*0.05,
                     life: 60 + Math.random()*40,
                     size: 2 + Math.random()*3,
                     a: 1,
      });
    }
    if (!animating) animate();
  }
  let animating = false;
  function animate(){
    animating = true;
    ctx.clearRect(0,0,fx.width,fx.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.life -= 1;
      p.a = Math.max(0, p.life/100);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    particles = particles.filter(p => p.life > 0 && p.y < fx.height+20);
    if (particles.length) requestAnimationFrame(animate);
    else animating = false;
  }

  // Draglogg
  const movesList = document.getElementById('movesList');
  function addMove(player, index){
    const row = Math.floor(index/3)+1;
    const col = (index%3)+1;
    const li = document.createElement('li');
    li.textContent = `${player} → ruta (${row}, ${col})`;
    movesList.appendChild(li);
    movesList.scrollTop = movesList.scrollHeight;
  }
  function clearMoves(){ movesList.innerHTML=''; }

  function endGame(type){
    gameOver = true;
    cells.forEach(c => c.disabled = true);
    stopTurnTimer();
    const s = store.read();
    if (type.winner){
      s[type.winner]++;
      setStatus(`🎉 Spelare ${type.winner} vinner!`);
      showWinLine(type.combo);
      burstConfetti();
      // för nästa omgång får förloraren börja
      nextStarter = other(type.winner);
    } else {
      s.D++;
      setStatus(`Det blev oavgjort.`);
      nextStarter = Math.random() < 0.5 ? 'X' : 'O';
    }
    store.write(s);
    updateScoreUI();
  }

  function handleMove(index, el){
    if (gameOver || board[index]) return;

    stopTurnTimer();

    // Ta bort "senaste drag"
    if (lastMove >= 0) cells[lastMove].classList.remove('last');

    board[index] = current;
    el.textContent = current;
    el.classList.add(current.toLowerCase(), 'placed', 'last');
    el.setAttribute('aria-label', `Ruta ${index+1} ${current}`);
    lastMove = index;

    addMove(current, index);

    const result = checkWinner();
    if (result){
      endGame(result);
      return;
    }
    if (board.every(Boolean)){
      endGame({draw:true});
      return;
    }

    current = other(current);
    setTurnUI();
    setStatus(`Spelare ${current} kör`);
    setGhosts();
    startTurnTimer();
  }

  // Events
  cells.forEach((cell, i) => {
    cell.addEventListener('click', () => handleMove(i, cell));
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleMove(i, cell);
      }
      // Piltangenter för fokus
      const row = Math.floor(i/3), col = i%3;
      let target = null;
      if (e.key === 'ArrowRight' && col < 2) target = i+1;
      if (e.key === 'ArrowLeft'  && col > 0) target = i-1;
      if (e.key === 'ArrowDown'  && row < 2) target = i+3;
      if (e.key === 'ArrowUp'    && row > 0) target = i-3;
      if (target !== null){
        e.preventDefault();
        cells[target].focus();
      }
    });
  });

  resetBtn.addEventListener('click', () => resetBoard(true));
  clearScoreBtn.addEventListener('click', () => {
    store.write({X:0,O:0,D:0});
    updateScoreUI();
  });
  swapStartBtn.addEventListener('click', () => {
    nextStarter = other(nextStarter);
    setStatus(`Nästa omgång: ${nextStarter} börjar`);
  });

  // Init
  updateScoreUI();
  setTurnUI();
  setGhosts();
  sizeFX();
  resetBoard(); // startar timer också
})();

