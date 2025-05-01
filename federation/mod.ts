import {
  Application,
  createFederation,
  Endpoints,
  Image,
  importJwk,
  Person,
} from "@fedify/fedify";
import { getLogger } from "@logtape/logtape";
import { PostgresKvStore, PostgresMessageQueue } from "@fedify/postgres";
import postgres from "postgres";
import { db } from "../lib/db.ts";
import { actors } from "../models/schema.ts";
import { eq } from "drizzle-orm";

const logger = getLogger("pitch-connect");

const TMP_INSTANCE_ACTOR_KEY =
  '{"kty":"RSA","alg":"RS256","n":"2h87n36_l2Jx3BBD7llVW4MmgusH5_bFHsDAxPMNBJc2_G63B9qrLWHqFkJ4ZbzF67kYFUZA1ca3XjjhTf8L6Wn-ILSwEDrc71N3wdB8_SqR7DagkcO7XlL9F6vM6z5E7RyOBO90xGgiNjQB6E2zmqeAjnMLRhR4jHsvRmSJVNbI4OE5FKZh4_TcDkXVpdkBJgPJOAWygK4mWJAavn3FA_N1wny-SXcJcC9fpGmtboh-8jtyCwX9xnhC_h0hlQeEW3uc8uXou6s9Ss__uzLhgC3Jw2DMbWwX96diJZbrAOUMBPwyek1GH7o8GzJTj3PSUn8v6AvUzNqIshFxGchHJ3G1ydBX3iKVBVdWGk3Xiq4GgoXQy80cQgPBef1vPvsrtRVQkbGZlWmijo1M1RfGJNt3g7kv05xwtMAjbR2E1Biar990p89xuM8sj-0fzNc8ixDNPoLi3VljhfWJIoSPf75IW0wjD_r85b_exUKvFzfSi3L3rQpW_-FdKnoDsFrbI9kY7bghN7P-cvASew_wA3V_gQgeZLOTk2PV9CZJ60lZRDRtbfZkbuHesPf0LYRM7u5XT9it6TVvcY1yLMs8aUXeTp2x0_RGKhvSTOPlIr_CDBjV64pVM-WevcA--Wlznud-6xxjKFCHwbhR-D7_1ICz0H1JBdpM-0qC-SPfnVk","e":"AQAB","d":"wp_txoIFGGIJ8G8-_fUOGcqrWVO3yT3CY49gMhwg-ICo2pM7k7GE3cipY9VJspW_EHcmywzVmyplwZgFSWAS0-H0lGBFXSX4rz-N8w1CCW-rptaTbZz1mdN4618rSJhWTjAVdMfpK7szE6RSM2LpqExfhDuYyp5HdioQY8IfW-kOcsHj-c4AOLPqin27hfFcefwU1n0W6oT5yDpE8sYsPjtFTxWZgNnLPSO4Nm7pBmCazS9HshhVeXsjY7TAm0aKzko9H-sPQC0qUo_HwtRCq-mvRzsfDV_O_vaGt72y0SiPEf-qVsCOmo7FRQshzjVtbJj6ORYdefBg2mp_vZ6cBSqtzOZVbyAFJjwW3PzAF4jyOKY8ddfzPHh962hLmnS9qsCCOXFPEvcrVHL65NL_wyYfArSs7MtDa-PjXCMfthRxVQQw9tUBizIeJclKb4k33nHEKgGr17uoMxHrElbwFPwQOIpcZEyQuoc7baWURyPRj_Xe90n4IuOc6MsSJ4r3_CRFrsjuikKSbmrykr3BhkD7oHxAne_-TmMagXQ8Tq_6TviY65OlkwaIy8Zm6aB3ht0GAi5vjnqTqimuy78FePX-6Qxsdml2FD_vJQfZSGJcM_6R6hnqKsFSYjnNYH_e5iIV4Zs1jWaE4E3tGiPMM5e1Es7JpNMpOIRMQtmqpQE","p":"32DDnzWy-GwxE64iKN7gUfBCA214cuMjqgNmqPBQ32xsmvPsqeU5pk_D_vr0-GryaErtVf7c4kB_kmynW3xIQJT3q1fP4mYYWmuNzk_yuTCya74Z0guoNjBPZKUOr1gLqC9fuOF4cZoi_dwzHBYOJViz7RA3z8kycpL4AofbXIppdtxUYPQy1zykmLtIrVuJ9y40Q1N1wohmcCmwWP1XQFYUD1NVA7TFMPeBBfrdlODBO7qQkaPdVXMoH90yAqgU3g6IwvTKwN68LRWWFsARn9tcx7X5-zikFjMVgYvwcWycNsVCB_FDfStbS9G-VF8J_Jf7wmk5Erdgd1riMuwNeQ","q":"-fn3z2_wIw_YECskBBSmw_AbD0ljCCk-K2XCJ_lBYZXl0KF2tfOQU3cX8fTx0oYBv1wyWPvfTQkzcZBwwbSpnLSzwOFtkVQ-osaw6jG9erjpF_2wqH9Ln7-bDaGMDSL7tsdxmQ6dM6NNV2Fitof1eywNzScprnZ5Tk65Y-pMZ-WFF37X7DdeA_mCUbcW2ykgc4tbJ5g3QW-yXPoK56roJhgYu6DakzyQPhHvXzf2cVvsHbKt01_zvnWyfBcSkIDbfSmj0w2cIOWe11cs_1AZe76b5wMOVcHJDVSkCXwUTmZA8UwtfFef24zyOHyQ7O8GXF97qzi9pF-mYmGfM0J24Q","dp":"SSpOqOVT257EbGfK9Iwb-XqyhKDkpOzVD6jRhWBBfQzsfcyLphJY0aqqzeexOXT-NT7lghdajhkGMBW6s3J_z_d7L_oxMzyxmVxFNGBnZlUW-8dmebArxqQIPTT7HF_AYbQyrEHdy4frEi9_5iErPPxS4sE_JqYGChUteta4-RS0-qOsV51k0a8hUo11fqLPC9FseOjrV26J7w8Yne1NGNuY8nQfEnmxZRqMfkLvNQZxBHlVRP7hTk3LxLQU313ih-FG1mSLzKSoCjRZ1tXOcAfP2fI3ERw6UrMkxivp85zZhe8Sc7uImYUMAEeRCd2fTccSRVllwkWiKTXxhTBgMQ","dq":"MDZl9TxBtIF5yqSHbcIN5_yHO4uL7icGNpiJuev5EDk4-eQqYS14yKBPnfsAKPpvm9jMXR03FESSB3U0SifuDqtLgAf6ee0lp39q38B4KxM-4cGsMNNcYpMx9I8T0_TLV5Vf84U-DJeScyf1Qf82-Wqlvsuu3lc7Tj8gwoSN9_vsj3uHaafEGkAlQl1tqxdjiuV1z00sWxKP9B7Fu6ja3X4IRyffAEbOCyqqYFMK1RJFl_S-UeZPvIw2wHgyvGwd6SX-0tXtJusil6XYp-VrBNLefs-4FBIsFMYeXTXxNK3EGMX4f-LmkhG9Jefgi9IOCALid0OaT_mivZbWfax0AQ","qi":"OcL40gc4WlPOm1sJxsfINZmRvI8ECnFeo34Tbmkge3Tjayl9p6nTXUDeLzI1wV4lb8MSnhwl-YsVTrd0Z31x2I-o215JjxoT4u6O06rrX506ZmXa6DtcXMxy2sYKZxObQZ4uXcMGaAl4FmgcU8WZtINN2gJYuVc38siMjtaMGFjBGTPFDmcMq0_gpAl3xlKqOo5Clhh-YiyIDvDf8cBw346iUmAUgsIkVDFrTu4gaVUmCmqcNEj8boeBMblAvWe1y62AhjYnke52m3IDKuTM59bX-0ds_D7HL111KGuQ3cLIwempZjMpKCha2p9eipbBeEl7xKjbMBxb90pGKao9Ng","key_ops":["sign"],"ext":true}';

// const INSTANCE_ACTOR_KEY = Deno.env.get("INSTANCE_ACTOR_KEY");
const INSTANCE_ACTOR_KEY = TMP_INSTANCE_ACTOR_KEY;

if (INSTANCE_ACTOR_KEY == null) {
  throw new Error("INSTANCE_ACTOR_KEY is required");
}
const INSTANCE_ACTOR_KEY_JWK = JSON.parse(INSTANCE_ACTOR_KEY);
if (INSTANCE_ACTOR_KEY_JWK.kty !== "RSA") {
  throw new Error("INSTANCE_ACTOR_KEY must be an RSA key");
}
const INSTANCE_ACTOR_KEY_PAIR: CryptoKeyPair = {
  privateKey: await importJwk(INSTANCE_ACTOR_KEY_JWK, "private"),
  publicKey: await importJwk({
    kty: INSTANCE_ACTOR_KEY_JWK.kty,
    alg: INSTANCE_ACTOR_KEY_JWK.alg,
    e: INSTANCE_ACTOR_KEY_JWK.e,
    n: INSTANCE_ACTOR_KEY_JWK.n,
    key_ops: ["verify"],
  }, "public"),
};

const federation = createFederation({
  kv: new PostgresKvStore(postgres(Deno.env.get("DATABASE_URL"))),
  queue: new PostgresMessageQueue(postgres(Deno.env.get("DATABASE_URL"))),
});

federation
  .setInboxListeners("/ap/actors/{identifier}/inbox", "/ap/inbox")
  .setSharedKeyDispatcher((ctx) => ({
    identifier: new URL(ctx.canonicalOrigin).hostname,
  }));

federation
  .setOutboxDispatcher(
    "/ap/actors/{identifier}/outbox",
    async (ctx, identifier, cursor) => {
      if (identifier === new URL(ctx.canonicalOrigin).hostname) {
        return { items: [] };
      }
    },
  );

federation
  .setFollowingDispatcher(
    "/ap/actors/{identifier}/followees",
    async (ctx, identifier, cursor) => {
      if (identifier === new URL(ctx.canonicalOrigin).hostname) {
        return { items: [] };
      }
    },
  );

federation
  .setFollowersDispatcher(
    "/ap/actors/{identifier}/followers",
    async (ctx, identifier, cursor, filter) => {
      if (identifier === new URL(ctx.canonicalOrigin).hostname) {
        return { items: [] };
      }
    },
  );

federation
  .setActorDispatcher(
    "/ap/actors/{identifier}",
    async (ctx, identifier) => {
      if (identifier == new URL(ctx.canonicalOrigin).hostname) {
        // Instance actor:
        const keys = await ctx.getActorKeyPairs(identifier);
        return new Application({
          id: ctx.getActorUri(identifier),
          preferredUsername: identifier,
          name: "Pitch Connect",
          summary: "An instance actor for Pitch Connect",
          manuallyApprovesFollowers: true,
          inbox: ctx.getInboxUri(identifier),
          outbox: ctx.getOutboxUri(identifier),
          endpoints: new Endpoints({
            sharedInbox: ctx.getInboxUri(),
          }),
          following: ctx.getFollowingUri(identifier),
          followers: ctx.getFollowersUri(identifier),
          icon: new Image({
            url: new URL("/favicon.svg", ctx.canonicalOrigin),
          }),
          publicKey: keys[0].cryptographicKey,
          assertionMethods: keys.map((pair) => pair.multikey),
        });
      }

      logger.debug("Dispatching actor request for identifier:", identifier);
      const [actor] = await db.select().from(actors).where(
        eq(actors.preferredUsername, identifier),
      );
      if (!actor) {
        return new Person({
          preferredUsername: identifier,
          name: identifier,
          id: ctx.getActorUri(identifier),
          summary: identifier,
        });
      }

      return new Person({
        id: ctx.getActorUri(identifier),
        preferredUsername: actor.preferredUsername,
        name: actor.name ?? actor.preferredUsername,
        inbox: actor.inbox,
        outbox: actor.outbox,
        summary: actor.summary,
      });
    },
  )
  .setKeyPairsDispatcher(async (ctx, identifier) => {
    if (identifier === new URL(ctx.canonicalOrigin).hostname) {
      // Instance actor:
      return [INSTANCE_ACTOR_KEY_PAIR];
    }
  });

export default federation;
