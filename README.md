Minimap - an educational JS Map Engine over HTML5 Canvas
========================================================

I've started writing minimap when I was working for a well-known mapping company, and we had like 3 map engines:
 - One, the "old" one, on our prod servers
 - One, the "soon to be one", with shiny features, in development since 1.5 years
 - One, the "hoops, I hacked it together on the weekend" which we used for HTML5 Mobile Maps

The latter one was using Canvas, written by Andrea G. 

As I got into the map development, and I did some features which required extensive understanding of how tile-based mapping works, I realized I explain tiling all-the-time.

So I asked: what's the shortest possible way to write a functional map engine?

And then: How to make calculations the fastest possible without using IntArrays?

The result was minimap, using shifting solely.

Enjoy.
