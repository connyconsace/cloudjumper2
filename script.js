let followWindow;

function openFollowPrompt() {
    followWindow = window.open('https://twitter.com/intent/follow?screen_name=ICN_Protocol', '', 'width=600,height=600');

    // Action-Button sichtbar machen
    document.getElementById('actionButton').style.display = 'inline-block';
    
    // Event Listener hinzufügen, um den Follow-Status zu überprüfen
    window.addEventListener('focus', checkFollowStatus);
}

function checkFollowStatus() {
    window.removeEventListener('focus', checkFollowStatus);

    if (followWindow && !followWindow.closed) {
        followWindow.close();
    }

    // Aktualisiere den Text des Action-Buttons
    document.getElementById('actionButton').innerText = 'Danke fürs Folgen!';
}

function showGame() {
    document.getElementById('game').style.display = 'block';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('followSection').style.display = 'none'; // Verstecke den Follow-Bereich

    // Hier kannst du die Spiel-Logik initialisieren
    startGame();
}

// Spiel-Logik beginnt hier
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

// Hier kannst du die Bilder laden und die Spiel-Initialisierung vornehmen
const doodlerImageLeft = new Image();
const doodlerImageRight = new Image();
const platformImage = new Image();
const backgroundImage = new Image();
const bulletImage = new Image();
const monsterImage = new Image(); // Monster Bild hinzufügen
doodlerImageLeft.src = 'pics/fox.png';
doodlerImageRight.src = 'pics/fox.png';
platformImage.src = 'pics/platform.png';
backgroundImage.src = 'pics/Background.png';
bulletImage.src = 'pics/coin.png';
monsterImage.src = 'pics/chef.png';

// Plattform und Spieler Physik
const platformWidth = 65;
const platformHeight = 20;
const platformStart = canvas.height - 50;
const gravity = 0.33;
const bounceVelocity = -12.5;
let minPlatformSpace = 15;
let maxPlatformSpace = 20;
let platforms = [{ x: canvas.width / 2 - platformWidth / 2, y: platformStart }];
let bullets = [];
let monsters = []; // Liste für Monster
let monsterSpawnChance = 0.02; // 2% Chance, dass Monster erscheinen
let maxMonsters = 2; // Maximal 2 Monster

// Zufallszahl-Generator
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Fülle den Bildschirm mit Plattformen
let y = platformStart;
while (y > 0) {
    y -= platformHeight + random(minPlatformSpace, maxPlatformSpace);

    let x;
    do {
        x = random(25, canvas.width - 25 - platformWidth);
    } while (
        y > canvas.height / 2 &&
        x > canvas.width / 2 - platformWidth * 1.5 &&
        x < canvas.width / 2 + platformWidth / 2
    );

    platforms.push({ x, y });
}

const doodle = {
    width: 60,
    height: 90,
    x: canvas.width / 2 - 20,
    y: platformStart - 120,
    dx: 0,
    dy: 0,
    currentImage: doodlerImageLeft,
    alive: true // Status des Doodlers
};

// Bullet Klasse
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 20;
        this.dy = -10;
    }

    update() {
        this.y += this.dy;
    }

    draw() {
        context.drawImage(bulletImage, this.x, this.y, this.width, this.height);
    }
}

class Monster {
  constructor(x, platformY) {
      this.x = x;
      this.y = platformY - 40; // Höhe des Monsters über der Plattform
      this.width = 40;
      this.height = 40;
  }

  draw() {
      context.drawImage(monsterImage, this.x, this.y, this.width, this.height);
  }

  // Prüfe, ob das Monster vom Doodler getroffen wurde
  isHitByBullet(bullet) {
      return bullet.x < this.x + this.width &&
             bullet.x + bullet.width > this.x &&
             bullet.y < this.y + this.height &&
             bullet.y + bullet.height > this.y;
  }

  // Prüfe, ob der Doodler das Monster berührt
  isTouchingDoodler(doodler) {
      return doodler.x < this.x + this.width &&
             doodler.x + doodle.width > this.x &&
             doodler.y < this.y + this.height &&
             doodler.y + doodle.height > this.y;
  }
}

let playerDir = 0;
let keydown = false;
let prevDoodleY = doodle.y;

// Neue Steuerungslogik mit den Pfeiltasten
document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
        doodle.dx = -5;
        doodle.currentImage = doodlerImageLeft;
        playerDir = -1;
    } else if (event.key === 'ArrowRight') {
        doodle.dx = 5;
        doodle.currentImage = doodlerImageRight;
        playerDir = 1;
    } else if (event.key === 'ArrowUp' && doodle.alive) {
        bullets.push(new Bullet(doodle.x + doodle.width / 2 - 5, doodle.y));
    }
});

document.addEventListener('keyup', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        keydown = false;
        doodle.dx = 0;
        playerDir = 0;
    }
})

function loop() {
  requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Hintergrund zeichnen
  context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // Schwerkraft
  doodle.dy += gravity;

  // Überprüfe, ob der Doodler unter den Bildschirm fällt
  if (doodle.y > canvas.height) {
      endGame();
  }

  if (doodle.y < canvas.height / 2 && doodle.dy < 0) {
      platforms.forEach(function (platform) {
          platform.y += -doodle.dy; // Plattformen nach oben bewegen
          // Synchronisiere die Y-Position der Monster mit der Plattform
          monsters.forEach(function (monster) {
              monster.y -= doodle.dy; // Monster folgen der Plattform
          });
      });

      while (platforms[platforms.length - 1].y > 0) {
          platforms.push({
              x: random(25, canvas.width - 25 - platformWidth),
              y: platforms[platforms.length - 1].y - (platformHeight + random(minPlatformSpace, maxPlatformSpace))
          });

          minPlatformSpace += 0.5;
          maxPlatformSpace += 0.5;
          maxPlatformSpace = Math.min(maxPlatformSpace, canvas.height / 2);
      }
  } else {
      doodle.y += doodle.dy;
  }

  doodle.x += doodle.dx;

  if (doodle.x + doodle.width < 0) {
      doodle.x = canvas.width;
  } else if (doodle.x > canvas.width) {
      doodle.x = -doodle.width;
  }

  // Plattformen zeichnen und Monster erzeugen
  platforms.forEach(function (platform) {
      context.drawImage(platformImage, platform.x, platform.y, platformWidth, platformHeight);

      if (
          doodle.dy > 0 &&
          prevDoodleY + doodle.height <= platform.y &&
          doodle.x < platform.x + platformWidth &&
          doodle.x + doodle.width > platform.x &&
          doodle.y < platform.y + platformHeight &&
          doodle.y + doodle.height > platform.y
      ) {
          doodle.y = platform.y - doodle.height;
          doodle.dy = bounceVelocity;
      }

      // Monster erzeugen, wenn weniger als 2 Monster vorhanden sind
      if (Math.random() < monsterSpawnChance && monsters.length < maxMonsters && platform.y < canvas.height / 2) {
          // Stelle sicher, dass das Monster direkt auf der Plattform gespawnt wird
          monsters.push(new Monster(platform.x + platformWidth / 2 - 20, platform.y)); // Monster auf Plattform-Höhe
      }
  });

  // Doodle zeichnen
  context.drawImage(doodle.currentImage, doodle.x, doodle.y, doodle.width, doodle.height);

  prevDoodleY = doodle.y;

  // Kugeln aktualisieren und zeichnen
  bullets.forEach(function (bullet, index) {
      bullet.update();
      bullet.draw();

      if (bullet.y + bullet.height < 0) {
          bullets.splice(index, 1);
      }
  });

  // Monster zeichnen und überprüfen
  monsters.forEach(function (monster, index) {
      monster.draw();

      // Überprüfe, ob ein Monster vom Doodler berührt wird
      if (doodle.alive && monster.isTouchingDoodler(doodle)) {
          endGame();
      }

      // Überprüfe, ob ein Monster von einer Kugel getroffen wurde
      bullets.forEach(function (bullet, bulletIndex) {
          if (monster.isHitByBullet(bullet)) {
              monsters.splice(index, 1); // Monster entfernen
              bullets.splice(bulletIndex, 1); // Kugel entfernen
          }
      });
  });
}

// Funktion, um das Spiel zu beenden
function endGame() {
    doodle.alive = false; // Doodler als nicht mehr lebendig markieren
    alert("Du wurdest von einem Monster erwischt oder bist gefallen! Das Spiel ist vorbei.");
    location.reload(); // Spiel neustarten
}

function startGame() {
    requestAnimationFrame(loop);
}