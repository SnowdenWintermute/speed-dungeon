# Typescript rewrite of [Roguelike Racing](https://roguelikeracing.com)

### Why are we using mostly static instead of instance methods?

-   Many of our class objects are sent over a websocket connection.
    When deserializing them, they are a plain JS object and lose all
    instance methods. To avoid the overhead and complexity of using
    something like class-transformer we are currently sticking with
    using static methods and passing the instance of the "class" when
    needed.
