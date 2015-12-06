Hi. I'm John. Welcome to Domtastic.

I started this project to help me understand chapter 15 of [Marijn Haverbeke's Eloquent Javascript](http://eloquentjavascript.net/index.html) by adapting his code to a simple projectile game I've called DOMTASTIC. The goal is to achieve, through customization, an understanding of the underlying techniques used in the chapter, including encapsulation, use of higher-order functions and basic asynchronous programming. 

##Unique/Heavily Modified Elements:

1. **Simple Projectile Motion:** Added constant acceleration equations to handle simple motion of objects in freefall. See *math/physics* section of the main script. 
2. **Obstacle Handling:** Instead of setting collision behaviors based on a fixed boundary (which Haverbeke does for collisions with the static grid), I've made each collision an object to object interaction. The user can define the result of a given collision by modifying an object's `interact` method. One consequence of this approach is that an object must have a lot of information about the path it has taken to a given collision. To handle this, Domtastic uses an object's leading corner as its reference point. The `yTest` and `dZone` methods provide outcomes for various approach vectors, and those outcomes in turn affect the way the `Level.interactWith` method handles the collisions.

Other code I've either left intact or lightly modified to handle Domtastic's unique functionality.

If you see something you dislike, please feel free to comment and/or suggest modifications. But just remember one thing: I'm a lawyer, not an engineer (yet).
