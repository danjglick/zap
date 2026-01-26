// npx --yes live-server --host=0.0.0.0 --port=8080
// http://10.0.0.145:8080

const FPS = 60
const MS_PER_FRAME = 1000 / FPS
const BALL_RADIUS = window.innerWidth / 16
const FLING_DIVISOR = 4
const GOAL_HEIGHT = BALL_RADIUS * 2
const GOAL_WIDTH = BALL_RADIUS * 4
const WALL_WIDTH = BALL_RADIUS * 5
const ENEMY_COUNT = 2
const SHIM = BALL_RADIUS * 2


let canvas;
let ctx;
let ball = {
  spawn: {
    xPos: 0,
    yPos: 0
  },
  xPos: 0,
  yPos: 0,
  xVel: 0,
  yVel: 0,
  isBeingFlung: false
}
let goal = {
  xPos: 0,
  yPos: 0 
}
let cannon = {
  xPos: 0,
  yPos: 0,
  angle: 0
}
let puddle = {
  xPos: 0,
  yPos: 0
}
let wormhole = {
  a: {
    xPos: 0,
    yPos: 0
  },
  b: {
    xPos: 0,
    yPos: 0
  }
}
let wall = {
  xPos: 0,
  yPos: 0,
  angle: 0
}
let key = {
  xPos: 0,
  yPos: 0,
  isGot: false
}
let enemies = []
let placedSprites = []
let touch1 = {
  xPos: 0,
  yPos: 0
}
let score = 0
let isWormholeEnabled = true

function initialize() {
  canvas = document.getElementById('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  document.addEventListener('touchstart', handleTouchstart)
  document.addEventListener('touchmove', handleTouchmove, { passive: false })
  document.addEventListener('wheel', (e) => { e.preventDefault() }, { passive: false })
  generateLevel()
}

function generateLevel() {
  placedSprites = []
  spawnBall()
  spawnGoal()
  spawnTrap(cannon)
  spawnTrap(puddle)
  spawnTrap(wormhole.a)
  spawnTrap(wormhole.b)
  spawnTrap(wall)
  spawnTrap(key)
  key.isGot = false
  loopGame()
}

function spawnBall() {
  let ballSpawn = {
    xPos: BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random(),
    yPos: canvas.height - BALL_RADIUS
  }
  ball = {
    spawn: ballSpawn,
    xPos: ballSpawn.xPos,
    yPos: ballSpawn.yPos,
    xVel: 0,
    yVel: 0,
    isBeingFlung: false
  }
}

function spawnGoal() {
  goal = {
    xPos: GOAL_WIDTH + (canvas.width - 2 * GOAL_WIDTH) * Math.random(),
    yPos: 0 
  }
}

function spawnTrap(trap) {
  let trapMinY = goal.yPos + GOAL_HEIGHT + SHIM
  let trapMaxY = ball.spawn.yPos - SHIM
  
  // don't touch when spawned
  let minDistance = BALL_RADIUS * 2.5
  let maxAttempts = 100
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    trap.xPos = BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random()
    trap.yPos = trapMinY + (trapMaxY - trapMinY) * Math.random()
    
    let overlaps = false
    for (let placed of placedSprites) {
      let dx = trap.xPos - placed.xPos
      let dy = trap.yPos - placed.yPos
      let distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < minDistance) {
        overlaps = true
        break
      }
    }
    if (!overlaps) break
  }
  
  if ('angle' in trap) {
    trap.angle = Math.random() * 2 * Math.PI
  }
  
  placedSprites.push({ xPos: trap.xPos, yPos: trap.yPos })
}

function spawnEnemies() {
  for (let i = 0; i < ENEMY_COUNT; i++) {
    enemies.push({
      xPosOfPointA: 0,
      yPosOfPointA: 0,
      xPosOfPointB: 0,
      yPosOfPointB: 0 
    })
  }
}

function resetLevel() {
  ball.xPos = ball.spawn.xPos
  ball.yPos = ball.spawn.yPos
  ball.xVel = 0
  ball.yVel = 0
  key.isGot = false
}

function handleTouchstart(e) {
  touch1.xPos = e.touches[0].clientX
  touch1.yPos = e.touches[0].clientY
  if (isClose(touch1, ball, BALL_RADIUS)) {
    ball.isBeingFlung = true
  }
}

function handleTouchmove(e) {
  e.preventDefault()
  let touch2 = {
    xPos: e.touches[0].clientX,
    yPos: e.touches[0].clientY
  }
  if (ball.isBeingFlung) {
    ball.xVel = (touch2.xPos - touch1.xPos) / FLING_DIVISOR
    ball.yVel = (touch2.yPos - touch1.yPos) / FLING_DIVISOR
  }
}

function loopGame() {
  moveBall()
  handleCollision()
  draw()
  setTimeout(loopGame, MS_PER_FRAME)
}

function moveBall() {
  ball.xPos += ball.xVel
  ball.yPos += ball.yVel
}

function handleCollision() {
 handleCollisionWithGoal()
 handleCollisionWithCannon()
 handleCollisionWithPuddle()
 handleCollisionWithWormhole()
 handleCollisionWithWall()
 handleCollisionWithKey()
 handleCollisionWithEdge()
}

function handleCollisionWithGoal() {
  if (
    ball.yPos - BALL_RADIUS < goal.yPos + GOAL_HEIGHT &&
    ball.xPos + BALL_RADIUS < goal.xPos + GOAL_WIDTH &&
    ball.xPos - BALL_RADIUS > goal.xPos - GOAL_WIDTH
  ) {
    if (key.isGot) {
      score++
      generateLevel()
    } else {
      ball.yVel = -ball.yVel
    }
  }
}

function handleCollisionWithCannon() {
  if (isClose(ball, cannon)) {
    let speed = Math.sqrt(ball.xVel * ball.xVel + ball.yVel * ball.yVel)
    ball.xVel = Math.sin(cannon.angle) * speed
    ball.yVel = -Math.cos(cannon.angle) * speed
  }
}

function handleCollisionWithPuddle() {
  if (isClose(ball, puddle)) {
    ball.xVel = 0
    ball.yVel = 0
  }
}

function handleCollisionWithWormhole() {
  if (!isWormholeEnabled) return
  if (isClose(ball, wormhole.a)) {
    ball.xPos = wormhole.b.xPos
    ball.yPos = wormhole.b.yPos
    isWormholeEnabled = false
    setTimeout(() => isWormholeEnabled = true, 1000)
  } else if (isClose(ball, wormhole.b)) {
    ball.xPos = wormhole.a.xPos
    ball.yPos = wormhole.a.yPos
    isWormholeEnabled = false
    setTimeout(() => isWormholeEnabled = true, 1000)
  }
}

function handleCollisionWithWall() {
  let dirX = Math.cos(wall.angle)
  let dirY = Math.sin(wall.angle)
  let startX = wall.xPos - WALL_WIDTH / 2 * dirX
  let startY = wall.yPos - WALL_WIDTH / 2 * dirY
  let toStartX = ball.xPos - startX
  let toStartY = ball.yPos - startY
  let projection = Math.max(0, Math.min(WALL_WIDTH, toStartX * dirX + toStartY * dirY))
  let closestX = startX + projection * dirX
  let closestY = startY + projection * dirY
  let toClosestX = ball.xPos - closestX
  let toClosestY = ball.yPos - closestY
  let distance = Math.sqrt(toClosestX * toClosestX + toClosestY * toClosestY)
  let threshold = BALL_RADIUS + BALL_RADIUS / 8
  if (distance < threshold) {
    let normalX = toClosestX / distance
    let normalY = toClosestY / distance
    let dot = ball.xVel * normalX + ball.yVel * normalY
    ball.xVel -= 2 * dot * normalX
    ball.yVel -= 2 * dot * normalY
    ball.xPos = closestX + normalX * threshold
    ball.yPos = closestY + normalY * threshold
  }
}

function handleCollisionWithKey() {
  if (isClose(ball, key, BALL_RADIUS + BALL_RADIUS / 2)) {
    key.isGot = true
  }
}

function handleCollisionWithEdge() {
  if (ball.xPos - BALL_RADIUS <= 0) {
    ball.xPos = BALL_RADIUS
    ball.xVel = -ball.xVel
  } else if (ball.xPos + BALL_RADIUS >= canvas.width) {
    ball.xPos = canvas.width - BALL_RADIUS
    ball.xVel = -ball.xVel
  } else if (ball.yPos - BALL_RADIUS < 0) {
    ball.yPos = BALL_RADIUS
    ball.yVel = -ball.yVel
  } else if (ball.yPos + BALL_RADIUS > canvas.height) {
    resetLevel()
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawBall()
  drawGoal()
  drawCannon()
  drawPuddle()
  drawWormhole()
  drawWall()
  drawKey()
  drawScore()
}

function drawBall() {
  ctx.beginPath()
  ctx.arc(ball.xPos, ball.yPos, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()
}

function drawGoal() {
  ctx.beginPath()
  for (let i = 0; i < 2; i++) {
    let half_goal_width = (i == 1 ? GOAL_WIDTH : -GOAL_WIDTH) / 2
    ctx.rect(goal.xPos, goal.yPos, half_goal_width, GOAL_HEIGHT)
  }
  ctx.fillStyle = 'grey'
  ctx.fill()
}

function drawCannon() {
  ctx.save()
  ctx.translate(cannon.xPos, cannon.yPos)
  ctx.rotate(cannon.angle)
  ctx.beginPath()
  ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = 'orange'
  ctx.fill()
  ctx.fillStyle = 'black'
  ctx.beginPath()
  ctx.moveTo(0, -BALL_RADIUS * 0.6)
  ctx.lineTo(BALL_RADIUS * 0.4, BALL_RADIUS * 0.2)
  ctx.lineTo(BALL_RADIUS * 0.15, BALL_RADIUS * 0.2)
  ctx.lineTo(BALL_RADIUS * 0.15, BALL_RADIUS * 0.6)
  ctx.lineTo(-BALL_RADIUS * 0.15, BALL_RADIUS * 0.6)
  ctx.lineTo(-BALL_RADIUS * 0.15, BALL_RADIUS * 0.2)
  ctx.lineTo(-BALL_RADIUS * 0.4, BALL_RADIUS * 0.2)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawPuddle() {
  ctx.beginPath()
  ctx.arc(puddle.xPos, puddle.yPos, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = "blue"
  ctx.fill()
}

function drawWormhole() {
  for (let component of Object.values(wormhole)) {
    ctx.beginPath()
    ctx.arc(component.xPos, component.yPos, BALL_RADIUS, 0, 2 * Math.PI)
    ctx.fillStyle = "purple"
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(wormhole.a.xPos, wormhole.a.yPos)
  ctx.lineTo(wormhole.b.xPos, wormhole.b.yPos)
  ctx.lineWidth = 1
  ctx.strokeStyle = "purple"
  ctx.stroke()
  ctx.closePath()
}

function drawWall() {
  ctx.save()
  ctx.translate(wall.xPos, wall.yPos)
  ctx.rotate(wall.angle)
  ctx.beginPath()
  ctx.moveTo(-WALL_WIDTH / 2, 0)
  ctx.lineTo(WALL_WIDTH / 2, 0)
  ctx.lineWidth = BALL_RADIUS / 4
  ctx.strokeStyle = "brown"
  ctx.stroke()
  ctx.restore()
}

function drawKey() {
  ctx.beginPath()
  ctx.arc(key.xPos, key.yPos, BALL_RADIUS / 2, 0, 2 * Math.PI)
  ctx.fillStyle = "green"
  ctx.fill()
  if (!key.isGot) {
    ctx.beginPath()
    ctx.moveTo(goal.xPos - GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineTo(goal.xPos + GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineWidth = BALL_RADIUS / 4
    ctx.strokeStyle = "green"
    ctx.stroke()
    ctx.restore()
  }
}

function drawScore() {
  ctx.font = `bold ${GOAL_HEIGHT}px sans-serif`
  ctx.fillStyle = 'black'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(score, goal.xPos, goal.yPos + GOAL_HEIGHT / 2)
}

function isClose(objectA, objectB, threshold = SHIM) {
  return(
    Math.abs(objectA.xPos - objectB.xPos) < threshold && 
    Math.abs(objectA.yPos - objectB.yPos) < threshold
  )
}
