function chess_steg(data) {
    let numin = bigInt(1); // start at 1 so that leading zero bytes are not lost

    for (var i = data.length-1; i >= 0; i--) {
        numin = numin.multiply(256).add(data.charCodeAt(i));
    }

    // numin is now a bignum representing the input data

    let game = new Chess();
    while (numin.compare(0) == 1) { // while numin > 0
        let moves = legal_moves(game);

        let pickmove = numin.mod(moves.length);
        numin = numin.subtract(pickmove).divide(moves.length);

        game.move(moves[pickmove]);
    }

    var pgn = game.pgn();
    if (game.turn() == 'b') {
        pgn += " 0-1 {Black resigns}";
    } else {
        pgn += " 1-0 {White resigns}";
    }

    return pgn;
}

function chess_unsteg(pgn) {
    let numdata = bigInt(0);

    let game = new Chess();
    game.load_pgn(pgn);

    while (true) {
        let pickedmove = game.undo();
        if (pickedmove == undefined) {
            break;
        }
        pickedmove = pickedmove.san;

        let moves = legal_moves(game);
        let idx;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i] == pickedmove) {
                idx = i;
                break;
            }
        }

        numdata = numdata.multiply(moves.length).add(idx);
    }

    let data = '';

    while (numdata.compare(1) == 1) { // while numdata > 1
        let c = numdata.mod(256);
        numdata = numdata.subtract(c).divide(256);
        data += String.fromCharCode(c);
    }

    return data;
}

function legal_moves(game) {
    let all_moves = game.moves().sort();

    let moves = [];
    for (let i = 0; i < all_moves.length; i++) {
        if (all_moves[i].slice(-1) != '#')
            moves.push(all_moves[i]);
    }

    return moves;
}
