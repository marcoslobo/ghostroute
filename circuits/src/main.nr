use dep::std;

fn main(
    // --- INPUTS PUBLICOS (O Smart Contract verifica) ---
    root: pub Field,                 // Raiz da Merkle Tree no contrato
    nullifier_hash: pub Field,       // Hash para invalidar a nota antiga
    change_commitment: pub Field,    // Hash da nova nota de troco
    action_hash: pub Field,          // Hash dos parametros da Uniswap (anti-tamper)
    invest_amount: pub Field,        // Valor que vai para a Uniswap
    
    // --- INPUTS PRIVADOS (Segredos do Usuario) ---
    note: Note,                      // A nota completa (segredos)
    index: Field,                    // Posicao da nota na arvore
    path: [Field; 20],               // Merkle Path (para arvore de altura 20)
    change_note: Note,               // A nova nota de troco
) {
    // 1. Verificar se a nota original pertence a arvore (Inclusion Proof)
    let leaf = compute_commitment(note);
    let check_root = std::merkle::compute_merkle_root(leaf, index, path);
    assert(root == check_root);

    // 2. Provar que o Nullifier Hash eh derivado corretamente
    // Isso impede que o usuario revele o nullifier_secret real
    assert(nullifier_hash == std::hash::pedersen_hash([note.nullifier_secret]));

    // 3. Verificacao de Integridade de Valores
    // Nota Original = Investimento + Troco
    assert(note.amount == invest_amount + change_note.amount);
    
    // 4. Garantir que o troco gerado corresponde ao commitment publico
    assert(change_commitment == compute_commitment(change_note));

    // 5. Garantir que os tokens batem
    assert(note.asset_id == change_note.asset_id);
}