# Node function Server
超簡単なAPIサーバです。  
シンプルに、関数を書いたファイルを置くだけで、APIになります。

## 仕様
```
├─functions         関数ファイルの置き場
└─static            静的ファイルの置き場
    ├─authed        認証済み
    │  └─testf
    ├─group_admin   認証済み（グループ）
    │  └─testf
    ├─group_user    　　　・・
    └─public        一般
        └─testf
```

- 関数ファイルの置き場、に関数を置くと、そのままAPIになります。
- 関数はPromiseでくるむと、非同期に値が返せます。
- アンダースコアから始まる関数は、認証されていないと使用できないです。
- 認証は、
  ..../xxxxx/authenticate に、username,pwdを投げると、JWTがもらえます。

好きに使ってください。