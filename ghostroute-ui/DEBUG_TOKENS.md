# Debug Token Display Issues

## Problems Reported

1. **Pool Investment Button Not Enabled** for ERC20 deposits
2. **Notes Still Show as ETH** for ERC20 deposits

## Fixes Applied

### Fix 1: Case-Insensitive Token Comparison
- Modified `isETH()` to normalize addresses to lowercase
- Modified `getTokenInfo()` to normalize lookup address to lowercase

### Fix 2: Debug Logging
- Added `getTokenSymbolDebug()` function with console logging
- Modified `getTokenInfo()` to log token lookups
- Modified `NotesList` to use debug version

### Fix 3: Better Custom Token Fallback
- Changed `getTokenSymbol()` fallback from `address...` to `TKN...` format
- This makes it more obvious when a token is custom

## Investigation Checklist

### Check 1: Token Storage in Notes
- [ ] Verify note.token is saved correctly in localStorage
- [ ] Check if note.token is lowercase/uppercase
- [ ] Verify note.token matches token address from deposit

### Check 2: Token Registry Lookup
- [ ] Verify ERC20 token is registered in TOKEN_REGISTRY
- [ ] Check if chainId matches when looking up token info
- [ ] Verify token address comparison is case-insensitive

### Check 3: Token Symbol Display
- [ ] Check if getTokenSymbol receives correct parameters
- [ ] Verify chainId is available when calling getTokenSymbol
- [ ] Check if isETH() function correctly identifies ERC20

### Check 4: Pool Compatibility
- [ ] Verify isPoolCompatible() logic for ERC20 tokens
- [ ] Check if pool token addresses match note token addresses
- [ ] Verify token comparison is case-insensitive

## Manual Debugging Steps

1. **Open Browser Console (F12)**
2. **Make an ERC20 deposit** (e.g., USDC or LOBO)
3. **Check console for:**
   - `[tokens] getTokenSymbol called:` - should show token address
   - `[tokens] isETH:` - should be false for ERC20
   - `[tokens] getTokenSymbol result:` - should show USDC/LOBO/etc

4. **Check localStorage:**
   - Open DevTools > Application > Local Storage
   - Look for `ghostroute_notes_<address>`
   - Verify `token` field matches deposited token address

5. **Check NotesList render:**
   - If notes show ETH, the issue is in getTokenSymbol() call
   - If notes show correct symbol but wrong amount, issue is in formatAmount()

## Expected Behavior

### For ETH Deposit:
```json
{
  "commitment": "0x...",
  "nullifier": "0x...",
  "value": "10000000000000000",
  "token": "0x0000000000000000000000000000000000000000000",
  "spent": false
}
```
**Display**: `0.010000 ETH`

### For USDC Deposit:
```json
{
  "commitment": "0x...",
  "nullifier": "0x...",
  "value": "100000000",
  "token": "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
  "spent": false
}
```
**Display**: `100.000000 USDC`

### For LOBO Token Deposit:
```json
{
  "commitment": "0x...",
  "nullifier": "0x...",
  "value": "100000000000000000000",
  "token": "0x7b42a2e4...", // Your LOBO token address
  "spent": false
}
```
**Display**: `100.000000 LOBO`
