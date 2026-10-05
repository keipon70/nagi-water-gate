# nagi — WATER GATE V2

WebGLによる水膜と、HTMLのHEROをまとめた、依存ライブラリ不要のWeb Componentです。後続LPセクションは含みません。

## プレビュー

公開: https://keipon70.github.io/nagi-water-gate/

確認用: https://keipon70.github.io/nagi-water-gate/?review — 0 / 25 / 55 / 100%へ移動できます。通常版には確認ボタンを出しません。

`nagi-share.html` は画像・CSS・JavaScriptをすべて含む共有用単一HTMLです。PCでは保存後、Chrome等で直接開けます。ローカルサーバーもネット接続も不要です。`nagi-share.zip` を他の方へ渡す場合は、展開してHTMLをブラウザで開いてください。スマートフォンのファイルプレビューではスクリプトが実行されない場合があるため、スマートフォンへのURL共有はGitHub Pagesへの公開が必要です。

このフォルダーで `python3 -m http.server 8765 --bind 127.0.0.1` を実行し、`http://127.0.0.1:8765` を開きます。ES ModulesのためファイルのダブルクリックではなくHTTPで開いてください。

## LPへ移植

`nagi-water-gate.js`、`water-shader.js`、`nagi-water-gate.css`、`assets/` を同じ階層のままコピーします。

```html
<script type="module" src="/components/nagi/nagi-water-gate.js"></script>
<nagi-water-gate reservation-url="https://your-booking-service.example/"></nagi-water-gate>
```

予約URLは実際のURLに置き換えてください。未指定ならクリック時に `nagi:reserve` イベントを発行します。デモページでは未接続である旨のダイアログを表示します。

`gate-src` / `hero-src` 属性で背景を差し替えられます。外部オリジン画像はCORS設定が必要なので、同一オリジンでの配置を推奨します。属性は接続時に読み取ります。

CSSはShadow DOM内に閉じています。親側に `overflow:hidden/auto` を付けるとstickyの基準が変わるため、通常のページスクロールの中に配置してください。`goTo(0〜1)` はスキップ／プレビュー操作用の公開メソッドです。切り離し時にイベント・GPUリソースを解放します。

## 水の仕組み

Canvas 2Dのみでの再現は、背景画素の連続的な屈折をCPUで処理するか、フィルター近似に頼る必要があるため採用しませんでした。WebGLのCanvas上で、不規則な縦の水筋と連続した水膜を高さ場として作り、その勾配で実際の背景を屈折させます。ぼかした背景テクスチャは初回にCanvas 2Dで生成します。

V2では時間とスクロールを分離しています。requestAnimationFrameで進める水の時計をGLSLへ渡し、水筋・少数の縦長のレンズ水滴・水膜の細かな揺らぎを常時下方向へ動かします。逆スクロールでも時計は逆行しません。水量・水膜の厚み・屈折・前景と背景の位置差・明暗・背景切替・HERO表示はscroll progressで決定します。中央では水膜越しに場所ごとにシーンを入れ替え、上から下に膜が抜けます。文字は終盤で順次表示され、CTAまで100%以内に完成します。

HERO到達（94.5%以上）、非表示タブ、画面外、Reduced Motionでは常時描画を停止します。通常のスクロール領域は300svh、stickyは100svh。水の時計は復帰時の長い経過時間を加算しません。

モバイルはDPR上限1（Desktopは1.5）、細い水筋の追加層を省略、水滴は最大4個（Desktopは9個）。上部に文字・下部に写真を配置するV1の構成を維持します。Reduced MotionとWebGL失敗時は120svhの短いopacity遷移です。JavaScriptなしの代替HTMLは利用先LPにも残してください（index.htmlに例あり）。

## 素材

- `assets/hero.webp`: 提供のVisual Masterから内蔵imagegenで文字・下線・矢印だけを除去した派生背景。人物・構図・光を保つ方針。生成による微細な差異はあります。
- `assets/gate.webp`: 提供の近接水画像から内蔵imagegenで前景の水を除いた背景。写真内の水が停止して見えることを防ぎます。
- 遠景のシャワー写真は暗さと素材感の参考のみ。遠くへ近づく演出には使用していません。
- 元ファイルは変更していません。WebP計約255KB。

画像編集プロンプトの要旨: HEROは「全ての文字・ロゴ・CTA下線を消し、その背後の漆喰と光を復元。人物、手、構図、色を保持」。GATEは「手前の水滴・水筋・レンズぼけを除去し、同じ視点・素材・光の空間を復元。水はWebGLで加える」。内蔵ツール使用、外部APIなし。

## 試作の制約

実際の流体計算・実写水動画ではなく、手続き的な水膜です。水滴の接近・重なりはありますが物理的な合流計算はありません。実機の「浴びている感覚」はレビュー対象です。Chromeの1440×900 / 390×844で、停止スクロール中の水の変化・逆スクロール・HERO時の静止・Reduced Motion・console errorなしを確認。iOS Safariや低性能Androidの実機検証、実機FPS測定は未実施。予約サービス未接続。GitHub Pagesで公開し、mainへのpushで更新します。
