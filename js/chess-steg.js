function chess_steg(data, use_engine) {
    let numin = bigInt(1); // start at 1 so that leading zero bytes are not lost

    data = encode_utf8(data);

    for (var i = data.length-1; i >= 0; i--) {
        numin = numin.multiply(256).add(data.charCodeAt(i));
    }

    // numin is now a bignum representing the input data

    let game = new Chess();
    while (numin.compare(0) == 1) { // while numin > 0
        let moves = use_engine ? reasonable_moves(game) : legal_moves(game);

        let pickmove = numin.mod(moves.length);
        numin = numin.subtract(pickmove).divide(moves.length);

        game.move(moves[pickmove]);
    }

    var pgn = game.pgn();
    if (game.turn() == 'b') {
        pgn += " { Black resigns. } 1-0";
    } else {
        pgn += " { White resigns. } 0-1";
    }

    return pgn;
}

function chess_unsteg(pgn, use_engine) {
    let numdata = bigInt(0);

    let game = new Chess();
    game.load_pgn(pgn);

    while (true) {
        let pickedmove = game.undo();
        if (pickedmove == undefined) {
            break;
        }
        pickedmove = pickedmove.san;

        let moves = use_engine ? reasonable_moves(game) : legal_moves(game);
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

    return decode_utf8(data);
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

function reasonable_moves(game) {
    let moves = legal_moves(game);

    // this makes p4wn play deterministically
    P4_DEBUG = 1;

    // get p4wn to evaluate each move
    for (var i = 0; i < moves.length; i++) {
        game.move(moves[i]);

        let p4state = p4_fen2state(game.fen());
        let p4move = p4state.findmove(2);
        moves[i] = [moves[i], -p4move[2]];

        game.undo();
    }

    moves.sort(function(a,b) {
        return b[1] - a[1];
    });

    let reasonable_moves = [moves[0][0]];

    // keep moves that are not too much worse than the best move (20 points = 1 pawn)
    for (var i = 1; i < moves.length; i++) {
        if (moves[0][1] - moves[i][1] > 10) {
            break;
        }

        reasonable_moves.push(moves[i][0]);
    }

    return reasonable_moves;
}

function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}
