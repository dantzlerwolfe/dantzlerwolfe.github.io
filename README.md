Hi! I'm John. Welcome to Domtastic.

I started this project to help me understand chapter 15 of [Marijn Haverbeke's Eloquent Javascript](http://eloquentjavascript.net/index.html) by adapting his code to a simple projectile game I've called DOMTASTIC. The goal is to achieve, through customization, an understanding of the underlying techniques used in the chapter, including encapsulation, use of higher-order functions and basic asynchronous programming. 

##Playing the Game##
Go to [dantzlerwolfe.github.io](dantzlerwolfe.github.io). This game is a browser game and was not designed responsively. Also, please use chrome or firefox. It will not work without javascript. So to get the best (and maybe only) experience, please use a laptop/desktop with a JS enabled browser.

##Unique/Heavily Modified Elements##
While I often used Haverbeke's code as a conceptual (and sometimes actual) starting point, you will notice that most of Domtastic's components are completely unique or are heavily customized variants of Haverbeke's sample code. Here is a list of the most unique or heavily customized sections of the program:

1. **Simple Projectile Motion:** I added constant acceleration equations to handle simple motion of objects in freefall (See *math/physics* section of the main script). This was good enough to handle the limited physics required by the game environment. The `Launcher.prototype.fire()` method uses the global `impulse()` method to launch projectiles. Those projectiles, in turn obey our constant acceleration equations after the launch process is over. 
2. **Obstacle Handling:** Instead of setting collision behaviors based on a fixed boundary (which Haverbeke does for collisions with the static grid), I've made each collision an object to object interaction. The user can define the result of a given collision by modifying an object's `interact` method. One consequence of this approach is that an object must have a lot of information about the path it has taken to a given collision. To handle this, Domtastic uses an object's "leading corner" as its reference point. The `yTest` and `dZone` methods provide outcomes for various approach vectors, and those outcomes in turn affect the way the `Level.interactWith` method handles the collisions. While this is my favorite part of the program, it also could use extensive conceptual improvement. For those who are interested, there is a [taxonomy of weird bounces](https://trello.com/c/opW4oQWu) on Domtastic's [Trello Board](https://trello.com/b/EneXrUnj). In order to really see the odd collisions that do occur, it's best to comment out the sections of the code that shrink and destroy projectiles so that projectiles bounce around indefinitely inside of a level.
3. **The Message Board:** What's an old school game without some classic text feedback? The messageboard is a sprawling family of event listeners that deliver near-clever quips in response to various achievements or disasters. In addition, the messageboard (for better or worse) is partially managed by the `pauseToggler` method on the `Level` object. 
4. **Interactions and Effects:** While not as code-intensive, the special interactions (like the shrinking projectiles or exploding targets) were a lot of fun to conceptualize and code. I hope to improve on a great number of things from this category in future iterations.

Feedback and suggestions are very welcome. This was an exploratory project. I learned a lot, but there is still a long way to go before I can feel at ease with javascript.

##Styling##
I used bootstrap's online customization form. [Here's the configuration gist](https://gist.github.com/67d862f7aaa14bc02a89). [Click here for further customization](http://getbootstrap.com/customize/?id=67d862f7aaa14bc02a89). From my perspective, the most pressing visual design issues are the non-responsive design, choppy animations and some problems with the color scheme. From a game design perspective, I'd like to add a keystroke interface and improve the overall game mechanics.

##Sound Credits:##
All of the sounds came from [freesound.org](http://freesound.org). I normalized volumes and made simple modifications using [twistedwave.com](https://twistedwave.com).

1. Game Winning Theme, zagi2, [Hard Bassline Groove](http://freesound.org/people/zagi2/sounds/181675/)
2. Earth Theme, cormi, [Night in the Forest](http://freesound.org/people/cormi/sounds/110387/)
3. Mars Theme, noirenex, [Sci-Fi Alarm](http://freesound.org/people/noirenex/sounds/159453/)
4. Jupiter Theme, ERH, [Sci-Fi Menace](http://freesound.org/people/ERH/sounds/42119/)
5. Launcher Effect, Setuniman, [boing OH_16m](http://freesound.org/people/Setuniman/sounds/146264/)
6. Small Explosion, juskiddink, [Distant Explosion](http://freesound.org/people/juskiddink/sounds/108640/)
7. Large Explosion, ryansnook, [Big Explosion](http://freesound.org/people/ryansnook/sounds/110111/)
8. Projectile Bounce, martian, [Chorused Bounces](http://freesound.org/people/martian/sounds/19347/)
9. Projectile Vanish, ljudman, [TV](http://freesound.org/people/ljudman/sounds/33243/)
10. Alien Taunt, james ducket, [Feeble Efforts](http://freesound.org/people/james%20duckett/sounds/55082/)

##To Do List##
There is a big to do list for this game. [It can be found on trello.](https://trello.com/b/EneXrUnj) I plan to keep it there until there's good reason not to. A lot of the coding and debugging I did is described there. The notes are not necessarily written for clarity but served more as placeholders for me so that I could easily hit the ground running after time off from the project. 

