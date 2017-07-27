/**
 * Created by Luke Newman on 23/11/2016.
 */


// self invoking anonymous function expression, check to see if this method is depreciated
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// what is to be executed once the page has loaded
window.onload = function() {
    var myMaze = new MazeCanvas();
    myMaze.initialise();
};


// Maze canvas object
function MazeCanvas() {
    var grid = []; // declaring an empty array to push cell objects into
    var current; // the current cell
    var stack = [];

    var TILE_ROWS = 40; // to be an input later possibly via drop down
    var TILE_COLS = 40;
    var TILE_W;
    var TILE_H;
    var mazeGrid = document.getElementById("maze_v1"); // size tiles based off div
    var ctx2 = mazeGrid.getContext("2d");
    var ctx2W = mazeGrid.clientWidth;
    var ctx2H = mazeGrid.clientHeight;
    mazeGrid.width = ctx2W;
    mazeGrid.height = ctx2H;

    this.initialise = function () {
        window.addEventListener('resize', resizeCanvas, false);

        setCellSize();
        generateCells();
        resizeCanvas();
        animationLoop();

    };

    function resizeCanvas() {
        ctx2W = mazeGrid.clientWidth;
        ctx2H = mazeGrid.clientHeight;
        mazeGrid.width = ctx2W;
        mazeGrid.height = ctx2H;

        TILE_W = Math.floor(mazeGrid.clientWidth / TILE_COLS);
        TILE_H = Math.floor(mazeGrid.clientHeight / TILE_ROWS);

        setCellSize();
        updateCells();
        draw();
        // display cells
    }

    // Function to paint the canvas black
    function paintCanvas() {
        // Set the fill color to black
        ctx2.fillStyle = "rgba(0,0,0,1)";

        // This will create a rectangle of white color from the
        // top left (0,0) to the bottom right corner (W,H)
        ctx2.fillRect(0, 0, ctx2W, ctx2H);
    }

    function draw() {
        // Call the paintCanvas function here so that our canvas
        // will get re-painted in each next frame
        paintCanvas();
        displayCells();
    }

    // function to set tile size
    function setCellSize() {
        var grid_W = mazeGrid.clientWidth;
        var grid_H = mazeGrid.clientHeight;

        if (grid_W < grid_H) {
            TILE_W = Math.floor(grid_W / TILE_COLS);
            TILE_H = Math.floor(grid_W / TILE_ROWS);
        } else {
            TILE_W = Math.floor(grid_H / TILE_COLS);
            TILE_H = Math.floor(grid_H / TILE_ROWS);
        }
    }

    // Initialising cell objects and pushing them into array
    function generateCells() {
        /** NOTE: OFFSET IS IMPORTANT **/
        var mazeWidth = TILE_W * TILE_COLS;
        var offset = (ctx2W - mazeWidth) / 2;

        for (var row = 0; row < TILE_ROWS; row++) {
            for (var col = 0; col < TILE_COLS; col++) {
                var cell = new Cell(row, col, offset);
                grid.push(cell);
            }
        }
        current = grid[0]; // set fist cell in grid as current grid
    }

    // Because we need the index so much, it is in it's one function to be called, to save repetition
    function index(row, col) {
        if (row < 0 || col < 0 || row > TILE_ROWS-1 || col > TILE_COLS-1) { // returns a bad val
            return -1;
        }

        return row * TILE_ROWS + col; // the magic formula for finding a 2d grid index with 1d array
    }

    // constructor for cell object, object needs to know where it is in the grid, and state of walls (open or closed)
    function Cell(row, col, offset) {
        this.row = row;
        this.col = col;
        this.offset = offset; // remove offset to make cell flex to full canvas size
        this.walls = [true, true, true, true]; // top, right, bottom, left
        this.visited = false;
        this.cellColour = "black";
        this.highlighted = false;

        this.checkNeighbours = function() {
            var neighbours = [];

            var top = grid[index(this.row-1, this.col)];
            var right = grid[index(this.row, this.col+1)];
            var bottom = grid[index(this.row+1, this.col)];
            var left = grid[index(this.row, this.col-1)];

            // because we are returning -1 for out of bounds, the neighbour will be set as undefined;
            // we only need to check it is defined as well as visited
            if (top && !top.isVisited()) { /// !top.visited works, such a thing as private data members in javascript?
                neighbours.push(top);
            }

            if (right && !right.isVisited()) {
                neighbours.push(right);
            }

            if ( bottom && !bottom.isVisited()) {
                neighbours.push(bottom);
            }

            if (left && !left.isVisited()) {
                neighbours.push(left);
            }

            if (neighbours.length > 0) {
                var r = Math.floor(Math.random() * neighbours.length);
                return neighbours[r];
            } else {
                return undefined; // it would probably do this anyway
            }


        };

        this.display = function () {
            var y = this.row * TILE_H;
            var x = this.col * TILE_W;

            // switch case later
            if (this.walls[0]) {
                drawLine(x + this.offset, y, x + TILE_W + this.offset, y, "black"); // top horizontal
            }

            if (this.walls[1]) {
                drawLine(x + TILE_W + this.offset, y, x + TILE_W + this.offset, y + TILE_H, "black"); // right vertical
            }

            if (this.walls[2]) {
                drawLine(x + TILE_W + this.offset, y + TILE_H, x + this.offset, y + TILE_H, "black"); // bottom horizontal
            }

            if (this.walls[3]) {
                drawLine(x + this.offset, y + TILE_H, x + this.offset, y, "black"); // left vertical
            }

            colourCell(x + this.offset, y, TILE_W, TILE_H, this.cellColour);  // colour the cell

            if (this.highlighted) {
                colourCell(x + this.offset, y, TILE_W, TILE_H, "green");
                this.highlighted = false;
            }
        };


        this.setCellOffset = function(newOffset) {
            this.offset = newOffset;
        };

        this.setVisited = function() { // probably no point to these in this dirty language
            this.visited = true;
        };

        this.isVisited = function() {
            return this.visited;
        };

        this.setColour = function(colour) {
            this.cellColour = colour
        };

        this.highlight = function() {
            this.highlighted = true;
        }
    }


    // function to perform search
    function dfs() {
        current.setVisited();
        current.highlight(); //maybe later
        current.setColour("purple");
        var next = current.checkNeighbours();

        if (next) { // if next is defined (it points to an index in the array / index is in bounds)
            next.visited = true;
            stack.push(current);
            removeWalls(current, next);
            current = next;
        } else if (stack.length > 0) { // if the stack is not empty
            current = stack.pop(); // pop a cell from the stack and make it the current cell
        }
    }

    function removeWalls(current, next) { // takes two cells and removes the wall between them
        var x = current.col - next.col; // -1 means next is the cell to the right of current
        var y = current.row - next.row; // -1 means next is the cell above current

        if(x === 1) { // if the value is 1, this means next cell is to the RIGHT of the current cell
            current.walls[3] = false; // remove left wall from current cell
            next.walls[1] = false; // remove right wall from next cell
        } else if (x === -1) { // if the value is -1, this means next cell is to the LEFT of the current cell
            current.walls[1] = false; // remove right wall from current cell
            next.walls[3] = false; // remove left wall from next cell
        }

        if(y === 1) { // if the value is 1, this means next cell is ABOVE the current cell
            current.walls[0] = false; // remove top wall from current cell
            next.walls[2] = false; // remove bottom wall from next cell
        } else if (y === -1) { // if the value is -1, this means next cell is BELOW the current cell
            current.walls[2] = false; // remove bottom wall from current cell
            next.walls[0] = false; // remove top wall from next cell
        }
    }

    // function to display Cells on canvas
    function displayCells() {
        for(var i = 0; i < grid.length; i++) {
            grid[i].display();
        }
    }

    // function to update cell offset on resize, allows maze to always be at center of page
    function updateCells() {
        var mazeWidth = TILE_W * TILE_COLS;
        var offset = (ctx2W - mazeWidth) / 2;

        for (var i = 0; i < grid.length; i++) {
            grid[i].setCellOffset(offset);
        }
    }

    // fills the tile with colour
    function colourCell(topLeftX, topLeftY, cellWidth, cellHeight, fillColour) {
        ctx2.lineWidth = 2;
        ctx2.fillStyle = fillColour;
        ctx2.fillRect(topLeftX, topLeftY, cellWidth, cellHeight);
    }

    // draws a cell wall
    function drawLine(topLeftX, topLeftY, xDest, yDest, lineColour) {
        ctx2.strokeStyle = lineColour;
        ctx2.beginPath();
        ctx2.moveTo(topLeftX,topLeftY);
        ctx2.lineTo(xDest, yDest); // Horizontal line
        ctx2.stroke();
    }

    function animationLoop() {
        dfs();
        displayCells();
        requestAnimFrame(animationLoop);
    }
}
// END maze canvas object
